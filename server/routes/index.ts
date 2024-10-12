import { defineEventHandler } from 'h3';

export default defineEventHandler((event) => {
  const isHttps = event.node.req.headers['x-forwarded-proto'] === 'https' || event.node.req.connection.encrypted;
  const protocol = isHttps ? 'https' : 'http';
  const host = `${event.node.req.headers.host}`;
  const fullHostUrl = `${protocol}://${host}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>iCal Feed Subscription</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                line-height: 1.5;
                background-color: #f9f9f9;
                border-radius: 8px;
            }
            h1 {
                color: #333;
            }
            .button {
                display: inline-block;
                margin-top: 20px;
                padding: 10px 20px;
                background-color: #007bff;
                color: white;
                text-decoration: none;
                border-radius: 5px;
            }
            .button:hover {
                background-color: #0056b3;
            }
            .warning {
                color: #e63946;
                font-size: 0.9em;
                margin-top: 10px;
            }
            .url-copy {
                background-color: #ececec;
                padding: 5px 10px;
                border-radius: 5px;
                display: inline-block;
                margin-top: 5px;
                margin-bottom: 20px;
                font-family: monospace;
                font-size: 0.9em;
                width: 100%;
            }
            .github-link, .software-link {
                color: #007bff;
                text-decoration: none;
            }
            .github-link:hover, .software-link:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <h1>Subscribe to Event Calendar</h1>
        <p>
            Here you can subscribe to the event calendar for our dog training events.
            By subscribing to our iCal feed, you will always stay up-to-date with upcoming events.
            Please note: The events include the current month and the next month.
        </p>
        <p>
            This feature is powered by <a class="software-link" href="https://dogworkers.software/" target="_blank">DogWorkers Software</a>.
        </p>
        <p>
            <strong>How to subscribe:</strong>
            <ol>
                <li>Copy the URL below.</li>
                <li>Go to your preferred calendar application and find the option to add a calendar by URL.</li>
                <li>Paste the URL to add it as a subscription. The calendar will update automatically with new events!</li>
            </ol>
        </p>
        <input class="url-copy" type="text" value="${fullHostUrl}/events" readonly onclick="this.select();" />
        <p>
            Or, download the static ICS file:
            <a href="${fullHostUrl}/events" download class="button">Download ICS File</a>
        </p>
        <p class="warning">
            Note: Downloading the file is not recommended as it does not provide a live calendar subscription and won't show live data updates.
        </p>
        <a class="github-link" href="https://github.com/JonathanSchndr/dogworkers-ical-server" target="_blank">View the project on GitHub</a>
    </body>
    </html>
  `;
});
