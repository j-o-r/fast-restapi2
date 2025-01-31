export default Api;
/**
 * Represents a Options object
 */
export type OptionsObject = {
    /**
     * -
     */
    port?: number | undefined;
    /**
     * -
     */
    host?: string | undefined;
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
    * @param  {object} app - class definition with static (async) methods
    * @returns {Promise<OptionsObject>}
    */
    static create(preFix: string, options: OptionsObject, app: object): Promise<OptionsObject>;
    /**
    * Stop, delete a server
    *
    * @returns {Promise<>}
    */
    static delete(): Promise<any>;
}
