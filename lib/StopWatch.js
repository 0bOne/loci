module.exports = class StopWatch
{
    _startNanoSeconds;

    constructor()
    {
        this._startNanoSeconds = 0n;
        this.Reset();
    }

    Reset()
    {
        const retVal = this.ElapsedTime();
        this._startNanoSeconds = process.hrtime.bigint();
        return retVal;
    }

    ElapsedTime()
    {
        //try
        {
        return process.hrtime.bigint() - this._startNanoSeconds;
        }
        //catch (e)
        {
            debugger;
        }
    }

    static ToSeconds(nsBigInt, decimals = 2)
    {     
        let strVal = nsBigInt.toString();
        let decimalPos = strVal.length - 9; //nanoseconds has 9 decimal places
        
        //pad so we get to at least one non-decimal digit
        while (decimalPos < 1)
        {
            strVal = "0" + strVal;
            decimalPos++;
        }
        let retVal = strVal.substr(0, decimalPos);
        if (decimals > 0)
        {
            retVal += "." + strVal.substr(decimalPos, decimals);
            //TODO: round rather than truncate
        }
        return retVal;
    }


}