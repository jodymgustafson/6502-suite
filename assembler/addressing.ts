import { parseNumber, isByte, isWord, toSignedByte, getLSB, getMSB } from "../util";

const LSB_MOD = "<";
const MSB_MOD = ">";

export type RegisterType = ""|"X"|"Y";
export type AddressingInfo = {
    value: number|string,
    register?: RegisterType,
    whichByte?: "<"|">"
}

/** Checks if the operand doesn't use an address */
export function checkNonAddress(op: string): AddressingInfo {
    // Accumulator instructions are counted as single-byte opcodes (ex: LSR A)
    return (op === undefined || op === "" || op === "A") ? { value: 0 } : undefined;
}

/** Checks if the operand is an immediate value */
export function checkImmediate(op: string): AddressingInfo {
    if (op[0] !== "#") {
        return undefined;
    }
    
    // format: #byte | #[<|>]word
    const match = /^#([<>]?)([$%]?[\dA-F]+)$/.exec(op);
    if (match) {
        const whichByte = match[1];
        let v = parseNumber(match[2]);
        if (whichByte) {
            if (!isWord(v)) {
                throw new Error("Immediate value must be a word when using byte modifier");
            }
            v = (whichByte === LSB_MOD ? getLSB(v) : getMSB(v));
        }
        if (!isByte(v)) {
            throw new Error("Immediate value must be a byte");
        }
        return {
            value: v
        };
    }
    else {
        // format: #[<|>]label
        const match = /^#([<>])([_a-zA-Z]\w+)$/.exec(op);
        if (match) {
            return {
                whichByte: match[1] as any,
                value: match[2]
            };
        }
    }

    throw new Error("Invalid format for immediate value");
}

/** Checks if the operand is a zero page value */
export function checkZeroPage(op: string): AddressingInfo {
    // format: byte[,X|Y]
    const match = /^([$%]?[\dA-F]+)\s*(,\s*([XY]?))?$/.exec(op);
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
        const matchAddr = /^([$%]?[\dA-F]+)\s*(,\s*([XY]?))?$/.exec(op);
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
    // format: (word[,X]) | (word)[,Y]
    const match = /^\(([$%]?[\dA-F]+)\s*(,\s*([X]?))?\)$/.exec(op) ||
                  /^\(([$%]?[\dA-F]+)\)\s*(,\s*([Y]?))?$/.exec(op)
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
    const match = /^([a-zA-Z]+\w*|[$%]?[\dA-F]+)$/.test(op);
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