
module.exports = class Logger
{

    _threadNumber;
    _threadPrefix;
    _parentPort;

    constructor(options, parentPort, threadNumber = 0)
    {
        this._parentPort = parentPort;
        this._threadNumber = threadNumber;
        this._threadPrefix = "T" + this._threadNumber + ": ";

        //console.log("verbosity is " + options.verbosity);
        
        //for speed, pre-wire functions so we can skip IF checks during logging
        switch (options.verbosity)
        {
            case "thread":
                this.Debug = this.Silent;
                this.DisplayInPlace = this.Silent;
                break;
            case "debug":
                //leave all methods alone
                this.DisplayInPlace = this.Silent;
                this.Thread = this.Silent;
                break;  
            case "info":
                this.Debug = this.Silent;
                this.DisplayInPlace = this.Silent;
                this.Thread = this.Silent;
                break;  
            case "silent":
            default:
                this.Debug = this.Silent;
                this.Info = this.Silent;
                this.Thread = this.Silent;
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

    Thread(message, obj)
    {
        this._toConsole(this._threadPrefix + message, obj);
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
            if (typeof obj !== "string")
            {
                debugger;
            }
            consoleMessage += " " + JSON.stringify(obj);
        }
        console.log(consoleMessage);
    }

    DisplayInPlace(message)
    {
        if (process.stdout.clearLine)
        {
            process.stdout.clearLine();
            process.stdout.cursorTo(4);
            process.stdout.write(message);
            process.stdout.cursorTo(0);
        }
    }

    ThreadProgress(message, obj)
    {
        if (this._parentPort)
        {
            const envelope = {
                id: "progress",
                threadNumber: this._threadNumber,
                data: obj
            };
            this._parentPort.postMessage(envelope);
        }
        else
        {
            this.DisplayInPlace(message + ":" + obj);
        }
    }

}