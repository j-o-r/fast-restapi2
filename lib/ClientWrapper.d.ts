/// <reference types="node" />
export default ClientWrapper;
export type HTTP = typeof import('http');
/**
 * @memberof module:fast-restapi2
 */
declare class ClientWrapper {
    /**
     * @param {import('http').IncomingMessage} req - Class: http.IncomingMessage
     * @param {import('http').ServerResponse} res - Class: http.ServerResponse
     * @param  {Object} [query] - key value object
     */
    constructor(req: import('http').IncomingMessage, res: import('http').ServerResponse, query?: any);
    req: import("http").IncomingMessage;
    res: import("http").ServerResponse;
    query: any;
    /**
     * @type {import('http').OutgoingHttpHeaders}
     */
    headerFields: import('http').OutgoingHttpHeaders;
    stream_node: string;
    stream_output: string;
    stream_write_count: number;
    stream_prefix: string;
    /**
     * Get posted data
     *
     * @returns {Promise<any>} this
     */
    getPost(): Promise<any>;
    /**
     * Add a header to the server repsonse
     *
     * @param  {string} k - key
     * @param  {string|number} v - value
     * @param  {boolean} [override] - overwrite key
     * @returns {void} this
     */
    addHeader(k: string, v: string | number, override?: boolean): void;
    /**
     * Get a header field
     *
     * @param  {string} k - Key to obtain
     * @returns {string|undefined} Key value
     */
    getHeader(k: string): string | undefined;
    /**
     * Write headers files, including a http status code
     *
     * @param  {number} status - http status to write
     * @returns {void}
     */
    writeHeaders(status: number): void;
    /**
     * response.write
     *
     * @param {string|Buffer} message - string to write
     * @param {BufferEncoding} [encoding] - format to write out
     * https://nodejs.org/api/http.html#http_response_write_chunk_encoding_callback
     * @returns {void}
     */
    write(message: string | Buffer, encoding?: BufferEncoding): void;
    /**
     * Serve something with a http status code
     *
     * @param  {number} status - http status code
     * @param  {any} [message] - any message
     * @returns {void}
     */
    serve(status: number, message?: any): void;
    /**
     * Stream a file to the client
     * (inluding check on HEAD and if-modified-since)
     * the client is disposed after this call
     * except if there is an arror during serving
     *
     * @param {URL} file - full path to file
     * @param {string} [mime] - mimtype (overrule standard `application/json`)
     * @returns {Promise<string>}
     */
    serveFile(file: URL, mime?: string): Promise<string>;
    /**
     * Stream a a folder to the client
     * the client is disposed after this call
     *
     * @param {URL} folder - full path to folder
     * @returns {Promise<string>}
     */
    serveFolder(folder: URL): Promise<string>;
    /**
     * Open a stream
     * Starts an array output '['
     * This is closed in closeStream
     *
     * @param  {string} [ns] - Start of an array namespace
     * @returns {void}
     */
    openStream(ns?: string): void;
    /**
     * Stream a javascript object
     *
     * @param  {Object} ob - Any object to take an array position in stream
     * @returns {void}
     */
    stream(ob: any): void;
    /**
     * Close a stream with optional trailing headers
     * in JSON the array is closed, in XML the close tag is added.
     *
     * @param  {Object} [trailing] - Trailing headers
     * @returns {void}
     */
    closeStream(trailing?: any): void;
    /**
     * Close and destroy this object
     *
     * @returns {void}
     */
    end(): void;
}
