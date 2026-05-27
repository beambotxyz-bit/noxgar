# Source Bases

This project starts from two open-source Agar-style bases.

## Server

- Repository: https://github.com/m-byte918/MultiOgarII
- Imported commit: `2fa3f1277b033fe9789d0daaa8aebbba01006122`
- Local path: `server/`
- License: Apache-2.0, preserved in `server/LICENSE.txt`

## Client

- Repository: https://github.com/Emupedia/emupedia-game-agar.io
- Imported commit: `2841facf28f72b74f5d4e5432f78300307aa700e`
- Imported path: `clients/agarv3`
- Local path: `client/`
- License: Apache-2.0 style license, original project license preserved in upstream.

## Reference

- Cigar2 was evaluated as a fallback protocol-6 client: https://github.com/Cigar2/Cigar2
- We did not import it as the active client because the Emupedia `agarv3` client already has stronger mobile/touch/joystick scaffolding.
