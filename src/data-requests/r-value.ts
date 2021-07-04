import axios from "axios";
import parse from "csv-parse";

import {ResponseData} from "./response-data";

import stream from "stream";


async function parseRValue(data: string): Promise<{ r: number; date: Date } | null> {
    const parser = parse(data)

    const records = []

    parser.on('readable', () => {
        let record;
        while (record = parser.read()) {
            records.push(record)
        }
    })

    await stream.promises.finished(parser);

    const keys = records[0];

    const latestValues = records[records.length - 1] as []

    let latestEntry = [];
    latestEntry = latestValues.reduce((previousValue, currentValue, currentIndex) => {
        latestEntry[keys[currentIndex]] = currentValue;
        return latestEntry;
    }, [])

    const dateString = latestEntry["Datum"];
    let rValue = latestEntry["PS_4_Tage_R_Wert"];

    if (typeof rValue === "string" || rValue instanceof String) {
        rValue = parseFloat(rValue.replace(",", "."));
    }

    const pattern = /(\d{2})\.(\d{2})\.(\d{4})/;
    const date = new Date(dateString.replace(pattern, "$3-$2-$1"));

    return {
        r: rValue,
        date: date,
    };
}

export async function getRValue(): Promise<ResponseData<number>> {
    const response = await axios.get(
        `https://raw.githubusercontent.com/robert-koch-institut/SARS-CoV-2-Nowcasting_und_-R-Schaetzung/main/Nowcast_R_aktuell.csv`
    );

    const data = response.data;
    const rData = await parseRValue(data);

    return {
        data: rData.r,
        lastUpdate: rData.date,
    };
}
