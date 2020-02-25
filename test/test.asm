ORG $0100
define max_x $FF;
define max_y $AA;
  LDY #$00
start:
  LDX #$00
start_x:
  INX
  CPX #max_x
  BNE start_x
  INY
  CPY #max_y
  BNE start
  BRK
