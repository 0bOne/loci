module.exports = class StopWatch
{
    _startNanoSeconds; 

    constructor()  
    {
		// contais a quote " that should be ignored 
		// all three lines "
		// are comments not a string 
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