module.exports = class Logger
{
    constructor(options)
    {
        //for speed, pre-wire functions so we can skip IF checks during logging
        switch (options.verbosity)
        {
            case "debug":
                //leave all methods alone
                this.DisplayInPlace = this.Silent;
                break;  
            case "info":
                this.Debug = this.Silent;
                this.DisplayInPlace = this.Silent;
                break;  
            case "silent":
            default:
                this.Debug = this.Silent;
                this.Info = this.Silent;
                break;
        }
    }

    Always(message, obj)
    {
        this._toConsole(message, obj);
    }

    Info(message, obj)
    {
        this._toConsole(message, obj);
    }

    Debug(message, obj)
    {
        this._toConsole(message, obj);
    }

    Silent(message, obj)
    {
        //do nothing
    }

    _toConsole(message, obj)
    {
        let consoleMessage = message;
        if (obj)
        {
            consoleMessage += JSON.stringify(obj);
        }
        console.log(consoleMessage);
    }

    DisplayInPlace(message)
    {
        //console.log(message);
        //return;
        if (process.stdout.clearLine)
        {
            process.stdout.clearLine();
            process.stdout.cursorTo(4);
            process.stdout.write(message);
        }
    }

}