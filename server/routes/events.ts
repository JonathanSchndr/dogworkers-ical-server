import ical from 'ical-generator';
import * as cheerio from 'cheerio';
import { format } from 'date-fns';
import { defineEventHandler } from 'h3';

// Lade Umgebungsvariablen (falls nicht automatisch von Nitro unterstützt)
import dotenv from 'dotenv';
dotenv.config();

const portalUrl = process.env.PORTAL_URL;

// Funktion zum Abrufen des HTML-Inhalts einer gegebenen URL mit Nitro's $fetch
async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await $fetch(url);
    if (typeof response === 'string') {
      return response;
    }
    throw new Error('Unexpected response type received');
  } catch (error) {
    console.error('Fehler beim Abrufen der Webseite:', error);
    throw new Error('Fehler beim Abrufen der Webseite: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
  }
}

// Hilfsfunktion zur Bestimmung des Veranstaltungstyps aus dem linkSuffix
function determineEventType(suffix: string): string {
  const baseName = suffix.split('?')[0].split('/').pop()?.replace('.php', '');
  return baseName ? baseName.charAt(0).toUpperCase() + baseName.slice(1) : '';
}

// Funktion zur Korrektur des Uhrzeitformats
function correctTimeFormat(datetime: string): string {
  return datetime.replace(/(AM|PM)$/, ' $1');
}

// Funktion zum Scrapen von Event-Daten aus dem HTML
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

      console.log('Debug: Raw Data Extracted');
      console.log('Title:', title);
      console.log('Start Time:', startTime);
      console.log('End Time:', endTime);
      console.log('Location:', location);
      console.log('Summary Input:', summaryInput);
      console.log('Link Suffix:', linkSuffix);

      const eventType = determineEventType(linkSuffix || '');
      const summary = `${eventType} - ${summaryInput || title}`;

      console.log('Parsed Data:');
      console.log('Event Type:', eventType);
      console.log('Summary:', summary);

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

// Funktion zur Erstellung eines iCal-Feeds aus den Event-Daten
async function generateICalFeed(): Promise<string> {
  const events = await scrapeEvents();
  const calendar = ical({ name: 'Smart Fellows Events' });

  events.forEach(event => {
    calendar.createEvent({
      start: event.start,
      end: event.end,
      summary: event.summary,
      location: event.location,
      url: event.url,
    });
  });

  return calendar.toString();
}

// Definieren Sie den Event-Handler für die Anfrage
export default defineEventHandler(async () => {
  try {
    const icsFeed = await generateICalFeed();
    return new Response(icsFeed, {
      headers: {
        'Content-Type': 'text/calendar',
        'Content-Disposition': 'attachment; filename="smartfellows-events.ics"',
      },
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des iCal-Feeds:', error);
    return new Response('Fehler beim Erstellen des iCal-Feeds', { status: 500 });
  }
});
