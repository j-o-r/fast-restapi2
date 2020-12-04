declare module "fast-restapi2" {
    /**
     * @param req - Class: http.IncomingMessage
     * @param res - Class: http.ServerResponse
     * @param [query] - key value object
     */
    class ClientWrapper {
        constructor(req: any, res: any, query?: any);
        /**
         * Get posted data
         * @returns this
         */
        getPost(): Promise<any>;
        /**
         * Add a header to the server repsonse
         * @param k - key
         * @param v - value
         * @param [override] - overwrite key
         * @returns this
         */
        addHeader(k: string, v: string | number, override?: boolean): void;
        /**
         * Get a header field
         * @param k - Key to obtain
         * @returns Key value
         */
        getHeader(k: string): string | undefined;
        /**
         * Write headers files, including a http status code
         * @param status - http status to write
         */
        writeHeaders(status: number): void;
        /**
         * response.write
         * @param message - string to write
         * @param [encoding] - format to write out
         * https://nodejs.org/api/http.html#http_response_write_chunk_encoding_callback
         */
        write(message: string | Buffer, encoding?: string): void;
        /**
         * Serve something with a http status code
         * @param status - http status code
         * @param [message] - any message
         */
        serve(status: number, message?: any): void;
        /**
         * Open a stream
         * In json we start an array output '[' in xml an opentag <ns>
         * This is closed in closeStream
         * @param [ns] - Start of an array namespace
         */
        openStream(ns?: string): void;
        /**
         * Stream a javascript object
         * @param ob - Any object to take an array position in stream
         */
        stream(ob: any): void;
        /**
         * Close a stream with optional trailing headers
         * in JSON the array is closed, in XML the close tag is added.
         * @param [trailing] - Trailing headers
         */
        closeStream(trailing?: any): void;
        /**
         * Close and destroy this object
         */
        end(): void;
    }
    /**
     * public api
     */
    class Api {
        /**
         * Create, start a server
         * @param preFix - namespace part of the URL to distinguish tha API ot a static file
         * @param options - http(s) startup options
         * @param app - class definition with status functions
         */
        static create(preFix: string, options: any, app: any): Promise<object>;
        /**
         * Stop, delete a server
         */
        static delete(): Promise<string>;
    }
}

