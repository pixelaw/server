import {AbiEnums, AbiEvents, AbiStructs, ParsedEvents} from "starknet";

declare module 'starkneta' {

    export function parseEvents(providerReceivedEvents: Array<Event>, abiEvents: AbiEvents, abiStructs: AbiStructs, abiEnums: AbiEnums): ParsedEvents;
}