module.exports = class StopWatch
{
    _startNanoSeconds; 

    constructor()  //this file contains two comments
    {
        this._startNanoSeconds = 0n;
        this.Reset();  
    }
    /*only one comment registers as a comment line*/

    Reset()
    {
        const retVal = this.ElapsedTime();
        this._startNanoSeconds = process.hrtime.bigint();
        return retVal;
    }

    ElapsedTime()
    {
        return process.hrtime.bigint() - this._startNanoSeconds;    
    }

    static ToSeconds(nsBigInt, decimals = 2)
    {     
        let strVal = nsBigInt.toString();
        let decimalPos = strVal.length - 9; 
        
        while (decimalPos < 1)
        {
            strVal = "0" + strVal;
            decimalPos ++;
        }
        let retVal = strVal.substr(0, decimalPos);
        if (decimals > 0)
        {
            retVal += "." + strVal.substr(decimalPos, decimals);
        }
        return retVal;
    }
}