"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const architect_1 = require("@angular-devkit/architect");
const fetch = require("node-fetch");
const fs = require('fs').promises;
require('dotenv').config({ path: '../yoga-lichtquelle/.env' });
const API_KEY = process.env.API_KEY;
const googleCalendarId = process.env.GOOGLE_CALENDAR_ID;
const API_BASE = 'https://www.googleapis.com/calendar/v3/calendars';
const filepath = './src/assets/google-calendar.json';
exports.default = architect_1.createBuilder((options, context) => {
    return new Promise((resolve, reject) => {
        context.reportStatus(`Executing "${options.command}"...`);
        getJson()
            .then(() => {
            resolve({ success: true });
        })
            .catch(e => reject(e));
        context.reportStatus(`Done.`);
    });
});
function getJson() {
    let url = new URL(buildUrl());
    let params = { key: API_KEY };
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    return fetch(url)
        .then(response => response.json())
        .then(data => data["items"])
        .then(items => gcalItemsToRawEventDefs(items))
        .then(events => { return { data: events }; })
        .then(events => fs.writeFile(filepath, JSON.stringify(events)));
}
// https://github.com/fullcalendar/fullcalendar/blob/master/packages/google-calendar/src/main.ts
function buildUrl() {
    return API_BASE + '/' + encodeURIComponent(parseGoogleCalendarId(googleCalendarId)) + '/events';
}
function parseGoogleCalendarId(url) {
    let match;
    // detect if the ID was specified as a single string.
    // will match calendars like "asdf1234@calendar.google.com" in addition to person email calendars.
    if (/^[^/]+@([^/.]+\.)*(google|googlemail|gmail)\.com$/.test(url)) {
        return url;
    }
    else if ((match = /^https:\/\/www.googleapis.com\/calendar\/v3\/calendars\/([^/]*)/.exec(url)) ||
        (match = /^https?:\/\/www.google.com\/calendar\/feeds\/([^/]*)/.exec(url))) {
        return decodeURIComponent(match[1]);
    }
}
function gcalItemsToRawEventDefs(items) {
    return items.map((item) => {
        return gcalItemToRawEventDef(item);
    });
}
function gcalItemToRawEventDef(item) {
    return {
        id: item.id,
        title: item.summary,
        start: item.start.dateTime || item.start.date,
        end: item.end.dateTime || item.end.date,
        url: item.htmlLink,
        location: item.location,
        description: item.description
    };
}
//# sourceMappingURL=index.js.map