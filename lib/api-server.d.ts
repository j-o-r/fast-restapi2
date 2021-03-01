export default Api;
/**
 * public api
 */
declare class Api {
    /**
     * Create, start a server
     *
     * @param  {string} preFix - namespace part of the URL to distinguish tha API ot a static file
     * @param  {Object} options - http(s) startup options
     * @param  {Object} app - class definition with status functions
     * @returns {Promise<Object>}
     */
    static create(preFix: string, options: any, app: any): Promise<any>;
    /**
     * Stop, delete a server
     *
     * @returns {Promise<string>}
     */
    static delete(): Promise<string>;
}
