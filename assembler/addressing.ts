import { parseNumber, isByte, isWord, toSignedByte } from "../util";

export type RegisterType = ""|"X"|"Y";
export type AddressingInfo = {
    value: number|string,
    register?: RegisterType
}

/** Checks if the operand doesn't use an address */
export function checkNonAddress(op: string): AddressingInfo {
    // Accumulator instructions are counted as single-byte opcodes (ex: LSR A)
    return (op === undefined || op === "" || op === "A") ? { value: 0 } : undefined;
}

/** Checks if the operand is an immediate value */
export function checkImmediate(op: string): AddressingInfo {
    // format: #byte
    const match = /^#([$%]?[\dA-F]{1,3})$/.exec(op);
    if (match) {
        const v = parseNumber(match[1]);
        if (isByte(v)) {
            return {
                value: v
            }
        }
    }

    return undefined;
}

/** Checks if the operand is a zero page value */
export function checkZeroPage(op: string): AddressingInfo {
    // format: byte[,X|Y]
    const match = /^([$%]?[\dA-F]{1,3})\s*(,\s*([XY]?))?$/.exec(op);
    if (match) {
        const v = parseNumber(match[1]);
        if (isByte(v)) {
            return {
                value: v,
                register: match[3] as RegisterType
            }
        }
    }

    return undefined;
}

/** Checks if the operand is absolute addressing */
export function checkAbsolute(op: string): AddressingInfo {
    // format: label[,X|Y]
    const matchLabel = /^([a-zA-Z]+\w*)\s*(,\s*([XY]?))?$/.exec(op);
    if (matchLabel) {
        return {
            value: matchLabel[1],
            register: matchLabel[3] as RegisterType
        }
    }
    else {
        // format: word[,X|Y]
        const matchAddr = /^([$%]?[\dA-F]{1,5})\s*(,\s*([XY]?))?$/.exec(op);
        if (matchAddr) {
            const v = parseNumber(matchAddr[1]);
            if (isWord(v)) {
                return {
                    value: v,
                    register: matchAddr[3] as RegisterType
                }
            }
        }
    }
    
    return undefined;
}

/** Checks if the operand is an indirection */
export function checkIndirect(op: string): AddressingInfo {
    // format: (word[,X|Y]) | (word)[,X|Y]
    const match = /^\(([$%]?[\dA-F]{1,5})\s*(,\s*([XY]?))?\)$/.exec(op) ||
                  /^\(([$%]?[\dA-F]{1,5})\)\s*(,\s*([XY]?))?$/.exec(op)
    if (match) {
        const v = parseNumber(match[1]);
        if (isWord(v)) {
            return {
                value: v,
                register: match[3] as RegisterType
            }
        }
    }

    return undefined;
}

/** Checks if the operand is a valid branch label or offset */
export function checkBranch(op: string): AddressingInfo {
    // format: label|signed-byte
    const match = /^([a-zA-Z]+\w*|[$%]?[\dA-F]{1,5})$/.test(op);
    if (match) {
        let num = parseNumber(op);
        if (!isFinite(num)) {
            // Must be a label
            return {
                value: op
            }
        }

        return {
            value: num
        }
}

    return undefined;
}