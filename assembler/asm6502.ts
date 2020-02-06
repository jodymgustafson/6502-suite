import { parseNumber, wordToBytes, toSignedByte, isSignedByte, parseByteList } from "../util";
import { OPCODES, OpCodeIndex } from "./opcodes";
import * as addressing from "./addressing";
import { AddressingInfo } from "./addressing";

export type MetaInstruction = {
    operation: string,
    operand: string,
    /** address of the next byte after this operation */
    address: number,
    /** number of bytes for the operation */
    byteCount: number,
    /** operation code */
    opCode?: number,
    /** value of the operand */
    opValue?: number,
    /** set if operation references a label */
    opLabel?: string,
    /** any other data */
    data?: any
}

/**
 * Assembles 6502 code into bytes
 * @param code Lines of assembly code
 */
export function assemble(code: string): number[]
{
    // First pass parses code into operations
    const instructions: MetaInstruction[] = parseLines(code.split("\n"));
    //console.log(lines);

    // Second pass resolves labels and parses operations into bytes
    const bytes: number[] = parseInstructions(instructions);

    return bytes;
}

/**
 * Resolves labels and parses operations into bytes
 * @param instructions 
 */
function parseInstructions(instructions: MetaInstruction[]) {
    const bytes: number[] = [];
    for (const i of instructions) {
        if (i.opCode !== undefined) {
            if (i.opLabel) {
                i.opValue = resolveLabel(i, instructions);
            }
            bytes.push(i.opCode);
            if (i.byteCount === 3) {
                bytes.push(...wordToBytes(i.opValue));
            }
            else if (i.byteCount === 2) {
                bytes.push(i.opValue);
            }
        }
        else if (i.operation === "DCB") {
            bytes.push(...i.data as number[]);
        }
    }

    return bytes;
}

function resolveLabel(line: MetaInstruction, lines: MetaInstruction[]): number
{
    const label = line.opLabel;
    const foundLabel = lines.find(l => l.operation === "LABEL" && l.opLabel === label);
    if (foundLabel) {
        if (line.byteCount === 2) {
            // branch, compute offset as signed byte
            const offset = foundLabel.address - line.address;
            if (!isSignedByte(offset)) {
                throw new Error("Label must be within 127 bytes: " + offset);
            }
            return toSignedByte(offset);
        }
        else {
            // jump
            return foundLabel.address;
        }
    }
    throw new Error("Invalid label: " + label);
}

function parseLines(lines: string[]): MetaInstruction[]
{
    const instructions: MetaInstruction[] = [];
    const defines = {};
    let addr = 0;

    for (let line of lines) {
        line = removeComments(line);

        // if it's a label and there's code after the label, split into 2 lines
        const labelEnd = line.indexOf(":");
        if (labelEnd >= 0 && labelEnd < line.length) {
            // parse the label and add it
            instructions.push(parseLine(line.slice(0, labelEnd + 1).trim(), addr, defines));
            // get the code after the label
            line = line.slice(labelEnd + 1);
        }

        line = line.trim().toUpperCase();
        if (line) {
            const parsed = parseLine(line, addr, defines);
            if (!isDefine(parsed)) {
                instructions.push(parsed);
                addr = parsed.address;
            }
        }
    };

    return instructions;
}

function removeComments(line: string) {
    const commentStart = line.indexOf(";");
    if (commentStart > 0) {
        line = line.slice(0, commentStart);
    }
    return line;
}

function parseLine(line: string, addr: number, defines: any): MetaInstruction
{
    //console.log(line);
    if (line.startsWith("*=")) {
        return parseBase(line);
    }

    // format: operation [operand]
    const tokens = /^(\S+)\s*(.+)?$/.exec(line).slice(1, 3);

    //console.log(tokens);
    const instr: MetaInstruction = {
        operation: tokens[0],
        operand: tokens[1],
        address: addr,
        byteCount: 0
    };

    if (isDCB(instr)) {
        instr.data = parseByteList(instr.operand);
        instr.byteCount = instr.data.length;
    }
    else if (isLabel(instr)) {
        // Remove the colon
        instr.opLabel = instr.operation.slice(0, -1).toUpperCase();
        instr.operation = "LABEL";
    }
    else if (isDefine(instr)) {
        // Operand format: [name value]
        const tuple = instr.operand.split(/\s/);
        defines[tuple[0]] = tuple[1];
        return instr;
    }
    else {
        if (instr.operand) {
            instr.operand = replaceDefines(instr.operand, defines);
        }
        setOpCode(instr);
    }

    instr.address += instr.byteCount;

    return instr;
}

function isDirective(parsed: MetaInstruction): boolean {
    return isLabel(parsed) || isDCB(parsed) || isDefine(parsed);    
}
function isLabel(parsed: MetaInstruction) {
    return parsed.operation.endsWith(":");
}
function isDCB(parsed: MetaInstruction) {
    return parsed.operation === "DCB";
}
function isDefine(parsed: MetaInstruction) {
    return parsed.operation === "DEFINE" || parsed.operation === "DEF";
}

function replaceDefines(operand: string, defines: any): string {
    for (const name in defines) {
        const value: string = defines[name];
        const idx = operand.indexOf(name);
        if (idx >= 0) {
            return operand.replace(name, value);
        }
    }

    return operand;
}

function setOpCode(instr: MetaInstruction): void
{
    const opCodeGroup = getOpCodeGroup(instr.operation);
    
    let info: AddressingInfo;
    if (info = addressing.checkNonAddress(instr.operand)) {
        instr.opCode = opCodeGroup[OpCodeIndex.SNGL];
        instr.byteCount = 1;
    }
    else if (opCodeGroup[OpCodeIndex.BRA] && (info = addressing.checkBranch(instr.operand))) {
        if (typeof info.value === "string") {
            instr.opLabel = info.value as string;
        }
        else {
            instr.opValue = info.value as number;
        }
        instr.opCode = opCodeGroup[OpCodeIndex.BRA];
        instr.byteCount = 2;
    }
    else if (info = addressing.checkImmediate(instr.operand)) {
        instr.opValue = info.value as number;
        instr.opCode = opCodeGroup[OpCodeIndex.IMM];
        instr.byteCount = 2;
    }
    else if (info = addressing.checkZeroPage(instr.operand)) {
        instr.opValue = info.value as number;
        instr.opCode = opCodeGroup[info.register === "X" ? OpCodeIndex.ZPX : info.register === "Y" ? OpCodeIndex.ZPY : OpCodeIndex.ZP];
        instr.byteCount = 2;
    }
    else if (info = addressing.checkAbsolute(instr.operand)) {
        if (typeof info.value === "string") {
            instr.opLabel = info.value as string;
        }
        else {
            instr.opValue = info.value as number;
        }
        instr.opCode = opCodeGroup[info.register === "X" ? OpCodeIndex.ABSX : info.register === "Y" ? OpCodeIndex.ABSY : OpCodeIndex.ABS];
        instr.byteCount = 3;
    }
    else if (info = addressing.checkIndirect(instr.operand)) {
        instr.opValue = info.value as number;
        instr.opCode = opCodeGroup[info.register === "X" ? OpCodeIndex.INDX : info.register === "Y" ? OpCodeIndex.INDY : OpCodeIndex.IND];
        instr.byteCount = (info.register === "X" || info.register === "Y") ? 2 : 3;
    }
    else {
        throw new Error("Unhandled operation: " + JSON.stringify(instr));
    }

    if (instr.opCode === null) {
        throw new Error("Error setting opCode: " + JSON.stringify(instr));
    }
}

function getOpCodeGroup(operation: string): number[]
{
    const opCodeGroup = OPCODES[operation] as number[];
    if (opCodeGroup) {
        return opCodeGroup;
    }

    throw new Error("Invalid operation: " + operation);
}

function parseBase(line: string): MetaInstruction
{
    // get the value after *=, that will be the new address
    const base = line.slice(2).trim();
    return {
        operation: "*=",
        operand: base,
        address: parseNumber(base),
        byteCount: 0
    };
}
