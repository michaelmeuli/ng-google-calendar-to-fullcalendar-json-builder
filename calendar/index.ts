import { BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
const fetch = require("node-fetch");
const fs = require('fs').promises;

require('dotenv').config({ path: '../yoga-lichtquelle/.env' })
const API_KEY = process.env.API_KEY;
const googleCalendarId = process.env.GOOGLE_CALENDAR_ID;
const API_BASE = 'https://www.googleapis.com/calendar/v3/calendars'
const filepath = './src/assets/google-calendar.json';



interface Options extends JsonObject {
    command: string;
    args: string[];
}

export default createBuilder<Options>((options, context) => {
    return new Promise<BuilderOutput>((resolve, reject) => {

        context.reportStatus(`Executing "${options.command}"...`);

        getJson()
            .then(() => {
                resolve({ success: true })
            })
            .catch(e => reject(e));

        context.reportStatus(`Done.`);
    });
});


function getJson() {
    let url = new URL(buildUrl());
    let params = { key: API_KEY };
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

    return fetch(url)
        .then(response => response.json())
        .then(data => data["items"])
        .then(items => gcalItemsToRawEventDefs(items))
        .then(events => {return {data: events}})
        .then(events => fs.writeFile(filepath, JSON.stringify(events)))
}


// https://github.com/fullcalendar/fullcalendar/blob/master/packages/google-calendar/src/main.ts

function buildUrl() {
    return API_BASE + '/' + encodeURIComponent(parseGoogleCalendarId(googleCalendarId)) + '/events'
}

function parseGoogleCalendarId(url) {
    let match
  
    // detect if the ID was specified as a single string.
    // will match calendars like "asdf1234@calendar.google.com" in addition to person email calendars.
    if (/^[^/]+@([^/.]+\.)*(google|googlemail|gmail)\.com$/.test(url)) {
        return url
    } else if (
        (match = /^https:\/\/www.googleapis.com\/calendar\/v3\/calendars\/([^/]*)/.exec(url)) ||
        (match = /^https?:\/\/www.google.com\/calendar\/feeds\/([^/]*)/.exec(url))
    ){
        return decodeURIComponent(match[1])
    }
}

function gcalItemsToRawEventDefs(items: any) {
    return items.map((item: any) => {
        return gcalItemToRawEventDef(item);
    });
}

function gcalItemToRawEventDef(item: any) {
    return {
        id: item.id,
        title: item.summary,
        start: item.start.dateTime || item.start.date, // try timed. will fall back to all-day
        end: item.end.dateTime || item.end.date, // same
        url: item.htmlLink,
        location: item.location,
        description: item.description
    }
}

