import ical from 'ical-generator';
import * as cheerio from 'cheerio';
import { format } from 'date-fns';
import { defineEventHandler } from 'h3';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const portalUrl = process.env.PORTAL_URL;
const timezone = process.env.TIMEZONE || 'UTC';

// Function to fetch HTML content from a given URL using Nitro's $fetch
async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await $fetch(url);
    if (typeof response === 'string') {
      return response;
    }
    throw new Error('Unexpected response type received');
  } catch (error) {
    console.error('Error fetching webpage:', error);
    throw new Error('Error fetching webpage: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Helper function to determine the event type from the linkSuffix
function determineEventType(suffix: string): string {
  const baseName = suffix.split('?')[0].split('/').pop()?.replace('.php', '');
  return baseName ? baseName.charAt(0).toUpperCase() + baseName.slice(1) : '';
}

// Function to correct the time format
function correctTimeFormat(datetime: string): string {
  return datetime.replace(/(AM|PM)$/, ' $1');
}

// Function to scrape event data from HTML
async function scrapeEvents(): Promise<any[]> {
  const currentMonth = format(new Date(), 'MM');
  const nextMonth = format(new Date().setMonth(new Date().getMonth() + 1), 'MM');
  const year = format(new Date(), 'yyyy');

  const monthsToFetch = [currentMonth, nextMonth];
  const events = [];

  for (const month of monthsToFetch) {
    const url = `${portalUrl}/terminliste.php?dateselection=01.${month}.${year}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    $('.row.mb-3').each((_, element) => {
      const title = $(element).find('.col-lg-3 h3 a').text().trim();
      const startTime = $(element).find('input[name="date_start"]').attr('value') || '';
      const endTime = correctTimeFormat($(element).find('input[name="date_end"]').attr('value') || '');
      const location = $(element).find('input[name="location"]').attr('value');
      const summaryInput = $(element).find('input[name="summary"]').attr('value');
      const linkSuffix = $(element).find('input[name="url"]').attr('value');

      const eventType = determineEventType(linkSuffix || '');
      const summary = `${title} - ${eventType}`;

      if (startTime && endTime && linkSuffix) {
        const start = new Date(startTime);
        const end = new Date(endTime);

        events.push({
          start,
          end,
          summary,
          location: location || 'Keine Angabe',
          url: `${portalUrl}${linkSuffix}`,
        });
      }
    });
  }

  return events;
}

// Function to generate an iCal feed from event data
async function generateICalFeed(): Promise<string> {
  const events = await scrapeEvents();
  const calendar = ical({ name: 'DogWorkers Events', timezone });

  events.forEach(event => {
    calendar.createEvent({
      start: event.start,
      end: event.end,
      summary: event.summary,
      location: event.location,
      url: event.url,
      timezone // Apply timezone to each event
    });
  });

  return calendar.toString();
}

// Define the event handler for the request
export default defineEventHandler(async () => {
  try {
    const icsFeed = await generateICalFeed();
    return new Response(icsFeed, {
      headers: {
        'Content-Type': 'text/calendar',
        'Content-Disposition': 'attachment; filename="dogworkers-events.ics"',
      },
    });
  } catch (error) {
    console.error('Error generating iCal feed:', error);
    return new Response('Error generating iCal feed', { status: 500 });
  }
});
