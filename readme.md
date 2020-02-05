# 6502 Suite
A suite of tools for assembling, disassembling and emulating 6502 microprocessor machine code.

## But Why?
Nobody in their right mind writes 6502 machine language anymore.
There's not a huge market for it these days.
So why did I create this project?

I learned to program on a Commodore C= back in the 1980's.
I guess it's just nostalgia for me.
But besides that I think it's a good learning tool.
The 6502 is a simple processor with a realtively easy to understand assembly language.
If you want to learn how computers actually work inside, close to the metal, then the 6502 is a good place to start.

## OK, but why an NPM library?
I wanted to make my own 6502 emulator web app.
There are some out there, but they look like they were made in 1998.
So I wanted to create a really good one to do some learning on.

There are some 6502 NPM packages out there but they have no documentation.
So I decided to make my own and document it so others could use it.

At first I was going to just take some existing code from those other projects, clean it up, and make an npm library out of it.
As I dug into them I found they had UI code mixed in with the other code making it impossible to use outside of that web page.
I tried to remove it, but the code was so bad with hardly no comments or good naming conventions.
It looks like it was ported from C or something.

So finally I decided to just write my own versions of an assembler and disassembler borrowing a little here and there.
Bulding an emulator is a lot more involved so I just included it here in all its glory since it wasn't paired to a UI.

