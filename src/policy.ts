export interface Policy {
    Statement: Statement[];
}

export interface Statement {
    Resource: string;
    Condition: Condition;
}

export interface Condition {
    DateLessThan: EpochTime;
    DateGreaterThan?: EpochTime;
    IpAddress?: SourceIp;
}

export interface EpochTime {
    "AWS:EpochTime": number;
}

export interface SourceIp {
    "AWS:SourceIp": string;
}

export function dateToEpochTime(date: Date): EpochTime {
    return { "AWS:EpochTime": Math.ceil(date.getTime() / 1000) };
}
