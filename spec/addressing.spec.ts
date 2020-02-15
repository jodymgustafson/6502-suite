import { checkZeroPage, checkAbsolute, checkImmediate, checkNonAddress, checkIndirect, checkBranch } from "../assembler/addressing";

describe("When checking non address mode", () => {
    it("should get non address", () => {
        const result = checkNonAddress("A");
        expect(result).toBeDefined();
    });
    it("should fail for address", () => {
        const result = checkNonAddress("123");
        expect(result).toBeUndefined();
        const result2 = checkNonAddress("#$1A");
        expect(result).toBeUndefined();
    });
});

describe("When checking immediate addressing mode", () => {
    it("should get immediate byte", () => {
        const result = checkImmediate("#$1A");
        expect(result).toBeDefined();
        expect(result.value).toBe(0x1A);
        expect(result.register).toBeUndefined();
    });
    it("should get immediate with LSB label", () => {
        const result = checkImmediate("#<label1");
        expect(result).toBeDefined();
        expect(result.value).toBe("label1");
        expect(result.whichByte).toBe("<");
        expect(result.register).toBeUndefined();
    });
    it("should get immediate with MSB label", () => {
        const result = checkImmediate("#>label1");
        expect(result).toBeDefined();
        expect(result.value).toBe("label1");
        expect(result.whichByte).toBe(">");
        expect(result.register).toBeUndefined();
    });
    it("should be undefined when not immediate format", () => {
        const result = checkImmediate("$2B");
        expect(result).toBeUndefined();
    });
    it("should fail when not a byte", () => {
        expect(() => checkImmediate("#$100")).toThrowError("Immediate value must be a byte");
        expect(() => checkImmediate("#$1234")).toThrowError("Immediate value must be a byte");
    });
    it("should fail when invalid format", () => {
        expect(() => checkImmediate("#foo")).toThrowError("Invalid format for immediate value");
        expect(() => checkImmediate("#-1")).toThrowError("Invalid format for immediate value");
    });
});

describe("When checking zero page addressing mode", () => {
    it("should get zero page with no register", () => {
        const result = checkZeroPage("$1A");
        expect(result).toBeDefined();
        expect(result.value).toBe(0x1A);
        expect(result.register).toBeUndefined();
    });
    it("should get zero page with X register", () => {
        const result = checkZeroPage("255,X");
        expect(result).toBeDefined();
        expect(result.value).toBe(255);
        expect(result.register).toBe("X");
    });
    it("should get zero page with Y register", () => {
        const result = checkZeroPage("0,Y");
        expect(result).toBeDefined();
        expect(result.value).toBe(0);
        expect(result.register).toBe("Y");
    });
    it("should fail when not a byte", () => {
        const result = checkZeroPage("-1,Y");
        expect(result).toBeUndefined();
        const result2 = checkZeroPage("1234");
        expect(result2).toBeUndefined();
    });
});

describe("When checking absolute addressing mode", () => {
    it("should get absolute with no register", () => {
        const result = checkAbsolute("$1A2B");
        expect(result).toBeDefined();
        expect(result.value).toBe(0x1A2B);
        expect(result.register).toBeUndefined();
    });
    it("should get absolute with X register", () => {
        const result = checkAbsolute("2345,X");
        expect(result).toBeDefined();
        expect(result.value).toBe(2345);
        expect(result.register).toBe("X");
    });
    it("should get absolute with Y register", () => {
        const result = checkAbsolute("0,Y");
        expect(result).toBeDefined();
        expect(result.value).toBe(0);
        expect(result.register).toBe("Y");
    });
    it("should get absolute with label", () => {
        const result = checkAbsolute("label");
        expect(result).toBeDefined();
        expect(result.value).toBe("label");
        expect(result.register).toBeUndefined();
    });
    it("should get absolute with label and X register", () => {
        const result = checkAbsolute("label,X");
        expect(result).toBeDefined();
        expect(result.value).toBe("label");
        expect(result.register).toBe("X");
    });
    it("should fail when not absolute address", () => {
        const result = checkAbsolute("#$2B");
        expect(result).toBeUndefined();
        const result2 = checkAbsolute("($002B)");
        expect(result2).toBeUndefined();
    });
    it("should fail when not a word", () => {
        const result = checkAbsolute("-1,Y");
        expect(result).toBeUndefined();
        const result2 = checkAbsolute("$FFFF1");
        expect(result2).toBeUndefined();
    });
});

describe("When checking indirect addressing mode", () => {
    it("should get indirect with no register", () => {
        const result = checkIndirect("($1A2B)");
        expect(result).toBeDefined();
        expect(result.value).toBe(0x1A2B);
        expect(result.register).toBeUndefined();
    });
    it("should get indirect with X register", () => {
        const result = checkIndirect("(2345,X)");
        expect(result).toBeDefined();
        expect(result.value).toBe(2345);
        expect(result.register).toBe("X");
    });
    it("should get indirect with Y register", () => {
        const result = checkIndirect("($0100),Y");
        expect(result).toBeDefined();
        expect(result.value).toBe(0x0100);
        expect(result.register).toBe("Y");
    });
    it("should fail when not indirect format", () => {
        const result = checkIndirect("#$2B");
        expect(result).toBeUndefined();
        const result2 = checkIndirect("$002B,X");
        expect(result2).toBeUndefined();
    });
    it("should fail when not a word", () => {
        const result = checkIndirect("(-1, Y)");
        expect(result).toBeUndefined();
        const result2 = checkIndirect("(0xFFFF1)");
        expect(result2).toBeUndefined();
    });
});

describe("When checking is branch addressing mode", () => {
    it("should get label", () => {
        const result = checkBranch("label1");
        expect(result).toBeDefined();
        expect(result.value).toBe("label1");
    });
});
