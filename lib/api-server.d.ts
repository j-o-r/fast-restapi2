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
    * @param  {string} preFix - namespace part of the URL to distinguish the API or a static file
    * @param  {OptionsObject} options - http(s) startup options
    * @param  {object} app - class definition with static methods
    * @returns {Promise<object>}
    */
    static create(preFix: string, options: OptionsObject, app: object): Promise<object>;
    /**
    * Stop, delete a server
    *
    * @returns {Promise<string>}
    */
    static delete(): Promise<string>;
}
