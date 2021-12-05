module.exports = class CodeScorer
{
    _scores;
    _languages;

    constructor(languages)
    {
        this._scores = {};
        this._languages = languages;
    }

    ResetToZero(language)
    {
        this._scores[language] = 0;
    }

    IncrementPoints(language, points)
    {
        this._scores[language] = this._scores[language] || 0;
        this._scores[language] += points;
    }

    GetWinningDefinition()
    {
        //figure out which language scored the most points
        const testScores = Object.assign({}, this._scores);

        const winner = this._getHighestScore(testScores);
        if (winner)
        {
            let clearWinner = true;
            const highScore = this._scores[winner];
            delete testScores[winner];
            const runnerUp = this._getHighestScore(testScores);
            if (runnerUp)
            {
                const nextScore = testScores[runnerUp];
                if (highScore === nextScore)
                {
                    //both have the equal points. no clear winner
                    clearWinner = false;
                }
            }

            if (clearWinner === true)
            {
                return this._languages[winner];
            }
        }   
        return false;
    }

    _getHighestScore()
    {
        let winner = "";
        let highScore = 0;
        for (let id in this._scores)
        {
            var score = this._scores[id];
            if (score > highScore)
            {
                highScore = score;
                winner = id;
            }
        }
        return winner;
    }
}
