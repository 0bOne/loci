module.exports = class StopWatch
{
    _startNanoSeconds; 

    constructor()  
    {
		const qs1 = "this is a quoted string that contains a '/*' start of block comment ";
			potentially ends early due to the above eol comment */
        this._startNanoSeconds = 0n;
        this.Reset();  	
		const sq2 = `this is another quoted string that contas a '*/' end of block comment `;
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