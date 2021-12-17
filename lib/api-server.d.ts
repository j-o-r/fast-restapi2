export default Api;
/**
 * Represents a Options object
 */
export type OptionsObject = {
    /**
     * -
     */
    port?: number;
    /**
     * -
     */
    host?: string;
};
/**
 * public api
 */
declare class Api {
    /**
     * Create, start a server
     *
     * @param  {string} preFix - namespace part of the URL to distinguish tha API ot a static file
     * @param  {OptionsObject} options - http(s) startup options
     * @param  {Object} app - class definition with static methods
     * @returns {Promise<Object>}
     */
    static create(preFix: string, options: OptionsObject, app: any): Promise<any>;
    /**
     * Stop, delete a server
     *
     * @returns {Promise<string>}
     */
    static delete(): Promise<string>;
}
