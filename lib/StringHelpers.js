module.exports = class StringHelpers
{
    static InclusiveRemoveBetween(content, lhs, rhs)
    {
        let leftCursor = content.indexOf(lhs);
        while (leftCursor  > -1)
        {
            let rightPos = content.indexOf(rhs, leftCursor + lhs.length);
            if (rhs === "" || rightPos === -1)
            {
                //only a left pos found, truncate and exit
                content = content.substr(0, leftCursor);
                break;
            }
            else
            {
                let leftPos = leftCursor;
                if (lhs !== rhs)  
                {   
                    //To allow for nesting, get a new left pos closest to the right pos
                    leftPos = content.lastIndexOf(lhs, rightPos - lhs.length);   
                } 
                //else cannot have nesting if lhs and rhs are the same      
                content = content.substr(0, leftPos) + content.substr(rightPos + rhs.length);
                leftCursor = content.indexOf(lhs, leftCursor);
            }
        }
        return content;
    }

    static RemoveWithinAllStringConstants(content, quoteSequence, lhs, rhs)
    {
        let leftPos = content.indexOf(quoteSequence);
        while (leftPos > -1)
        {
            let rightPos = content.indexOf(quoteSequence, leftPos + 1);
            if (rightPos === -1)
            {
                //unterminated string, treat remainder of content as the string
                const leftPart = content.substr(0, leftPos + 1);
                let rightPart = content.substr(leftPos + quoteSequence.length); 
                let filteredRightPart = StringHelpers.InclusiveRemoveBetween(rightPart, lhs, rhs);
                content = leftPart + filteredRightPart;
                break;
            }
            else
            {
                const stringLength = rightPos - (leftPos + quoteSequence.length);
                let middlePart = content.substr(leftPos + quoteSequence.length, stringLength);
                const cleanedMiddlePart = StringHelpers.InclusiveRemoveBetween(middlePart, lhs, rhs);
                const charactersDeleted = middlePart.length - cleanedMiddlePart.length;
                if (charactersDeleted > 0)
                {
                    const leftPart = content.substr(0, leftPos + 1);
                    const rightPart = content.substr(rightPos);
                    content = leftPart + cleanedMiddlePart + rightPart;
                }
                leftPos = (rightPos + quoteSequence.length) - charactersDeleted;
            }
            leftPos = content.indexOf(quoteSequence, leftPos);
        }
        return content;
    }

    static SpacePrefixCount(line)
    {
        let count = 0;
        while (line[count] === ' ')
        {
            count++;
        }        
        return count;
    }

    static MaskWithinStrings(content, quoteSequence, sequenceToMask, escapeSequence)
    {
        //scans a string (from a quote sequence to an unquote sequence, or to end of content)
        //allowing for \escape sequences, checks for target (ie comment) sequences in the string and replaces them with benign spaces
        //this ensures that when we remove comments, we only remove actual comments later, not those that appear comment-like within strings
        const harmlessReplacement = " ".repeat(sequenceToMask.length);

        const targetPositions = [];

        let quotePos = content.indexOf(quoteSequence);
        while(quotePos > -1)
        {
            let cursorPos = quotePos + quoteSequence.length;
            //move through string, one or more characters at a time until unquote is found or end of content is reached
            while(cursorPos < content.length)
            {
                const possibleEscapeSequence = content.substr(cursorPos, escapeSequence.length);
                const possibleUnquoteSequence = content.substr(cursorPos, quoteSequence.length);
                const possibleTargetSequence = content.substr(cursorPos, sequenceToMask.length);

                if (possibleUnquoteSequence === quoteSequence)
                {
                    cursorPos += quoteSequence.length;
                    break; //no longer in this string: jump to the next one.
                }
                else if (possibleEscapeSequence === escapeSequence)
                {
                    //skip over the character following the escape sequence. it could be a quote, 
                    //and we don't want it to be interpreted as a string terminator. 
                    cursorPos += escapeSequence.length;
                }
                else if (possibleTargetSequence === sequenceToMask)
                {
                    //found a match. save the position for later replacement
                    targetPositions.push(cursorPos);
                    cursorPos += sequenceToMask.length;
                }
                else
                {
                    cursorPos++;
                }
            } //no longer in string
            quotePos = content.indexOf(quoteSequence, cursorPos);
        }

        for (let position of targetPositions)
        {
            const leftPart = content.substr(0, position);
            const rightPart = content.substr(position + sequenceToMask.length);
            //const debugPart = content.substr(position, 6);
            content = leftPart + harmlessReplacement + rightPart;
        }
        
        return content;
    }


    static MaskWithinCommentBlocks(content, startSequence, endSequence, target)
    {
        //scans a block (from a start sequence to end sequence, or to end of content)
        //checks for comment sequences in the string and replaces them with benign spaces
        //this ensures that when we remove comments, we only remove actual comments later, not those that appear comment-like within strings
        const harmlessReplacement = " ".repeat(target.length);

        const targetPositions = [];

        let blockStartPos = content.indexOf(startSequence);
        while(blockStartPos > -1)
        {
            let cursorPos = blockStartPos + startSequence.length;
            //move through string, one or more characters at a time until end sequence is found or end of content is reached
            while(cursorPos < content.length)
            {
                const possibleEndSequence = content.substr(cursorPos, endSequence.length);
                const possibleTargetSequence = content.substr(cursorPos, target.length);

                if (possibleEndSequence === endSequence)
                {
                    cursorPos += endSequence.length;
                    break; //no longer in this string: jump to the next one.
                }
                else if (possibleTargetSequence === target)
                {
                    //found a match. save the position for later replacement
                    targetPositions.push(cursorPos);
                    cursorPos += target.length;
                }
                else
                {
                    cursorPos++;
                }
            } //no longer in string
            blockStartPos = content.indexOf(startSequence, cursorPos);
        }

        for (let position of targetPositions)
        {
            const leftPart = content.substr(0, position);
            const rightPart = content.substr(position + target.length);
            //const debugPart = content.substr(position, 6);
            content = leftPart + harmlessReplacement + rightPart;
        }
        
        return content;
    }

}