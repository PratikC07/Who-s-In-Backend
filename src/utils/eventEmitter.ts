import { EventEmitter } from "events";

// Create and export a single, shared instance of the event emitter
const eventEmitter = new EventEmitter();

export default eventEmitter;
