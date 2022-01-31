# RPB-API2
RetPaladinBot API written in TypeScript

## Routes
### Base URL
`https://api.retpaladinbot.com/`

### Commands
Fetch all commands <br/>
`/commands` 

Get command by name <br/>
`/commands/:name` 

### On the Fly Commands
Fetch all OTF commands <br/>
`/otf`

Fetch OTF command by name <br/>
`/otf/:name`

### Feedback
Get all feedback <br/>
`/feedback`

Get feedback by ID <br/>
`/feedback/:id`

### Subathon Stats
Most active chatters <br/>
`/subathon/chatters`

Gifted Subs <br/>
`/subathon/giftedsubs`

Bits Donated <br/>
`/subathon/bitsdonated`

### Emotes
I use these end points for the personalized DVD overlays I maintain that doesn't have much to do with RPB.

Current logged channels:
- EsfandTV
- Sodapoppin
- PATTIIIIIIII
- nmplol

Get sub emotes by channel name: <br/>
`/emotes/:channel`
