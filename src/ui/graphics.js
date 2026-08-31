// Pure SVG factories used by both world rendering and UI templates.
function oakSvg(withApples) {
  const apples = withApples ? `
    <g>
      <circle class="apple-fruit" cx="112" cy="146" r="10"/><circle class="apple-shine" cx="108" cy="142" r="3"/>
      <circle class="apple-fruit" cx="201" cy="109" r="10"/><circle class="apple-shine" cx="197" cy="105" r="3"/>
      <circle class="apple-fruit" cx="254" cy="164" r="10"/><circle class="apple-shine" cx="250" cy="160" r="3"/>
      <circle class="apple-fruit" cx="170" cy="208" r="10"/><circle class="apple-shine" cx="166" cy="204" r="3"/>
      <circle class="apple-fruit" cx="279" cy="225" r="9"/><circle class="apple-shine" cx="276" cy="222" r="2.7"/>
    </g>` : '';

  return `
    <svg class="tree-art" viewBox="0 0 360 520" aria-hidden="true">
      <ellipse fill="rgba(28,46,27,.17)" cx="180" cy="483" rx="88" ry="15"/>
      <path class="oak-trunk" d="M148 478C153 415 154 362 158 320C160 288 154 258 144 229C132 197 112 173 89 151C121 162 145 178 164 204C169 174 184 145 205 120C207 153 202 187 194 221C218 194 245 178 276 169C247 191 223 216 204 246C190 270 186 295 187 323C189 368 194 420 198 478Z"/>
      <path class="oak-trunk-light" d="M166 477C168 411 169 359 171 320C173 281 168 249 157 222C169 230 179 241 187 255C188 213 195 174 203 143C201 187 192 226 184 258C179 284 179 309 180 328C182 374 184 423 184 478Z"/>
      <path class="oak-bark" d="M165 401C158 365 162 332 160 303M186 390C191 348 186 316 190 280M173 288C169 269 171 250 178 229"/>
      <path class="oak-canopy" d="M57 236C31 216 25 181 42 153C28 122 39 87 67 72C72 39 100 19 132 24C150 2 187 -4 210 13C239 -1 276 13 285 44C317 48 337 75 331 104C354 121 359 155 343 178C360 204 350 239 324 254C321 286 293 307 263 304C244 329 208 336 181 320C154 338 117 329 103 302C78 302 58 281 57 257C49 251 49 243 57 236Z"/>
      <path class="oak-canopy-shadow" d="M48 168C63 204 96 226 132 226C112 244 98 263 103 302C78 302 58 281 57 257C49 251 49 243 57 236C31 216 25 181 42 153C43 158 45 163 48 168Z"/>
      <path class="oak-canopy-shadow" d="M211 315C244 306 269 284 280 257C299 264 314 262 324 254C321 286 293 307 263 304C244 329 208 336 181 320C192 319 202 317 211 315Z"/>
      <path class="oak-canopy-light" d="M91 85C112 47 154 35 188 48C163 57 145 76 136 101C119 92 104 87 91 85Z"/>
      <path class="oak-canopy-light" d="M204 44C231 21 266 31 280 57C252 52 229 60 211 78C211 65 209 54 204 44Z"/>
      ${apples}
    </svg>`;
}

function birchSvg() {
  return `
    <svg class="tree-art" viewBox="0 0 360 520" aria-hidden="true">
      <ellipse fill="rgba(28,46,27,.16)" cx="180" cy="483" rx="80" ry="14"/>
      <path class="birch-trunk" d="M156 478C160 419 160 371 160 328C160 288 155 250 149 218C145 196 135 174 120 151C143 166 158 181 169 203C171 169 180 135 194 104C198 144 195 183 188 221C204 197 226 181 252 171C228 193 210 218 197 249C187 273 184 297 185 328C187 373 190 422 194 478Z"/>
      <path class="birch-trunk-shadow" d="M178 478C177 412 176 363 177 324C178 279 174 247 166 221C173 229 180 239 186 251C187 211 189 170 193 130C196 173 192 215 185 251C180 281 181 319 182 348C183 394 185 438 186 478Z"/>
      <rect class="birch-mark" x="158" y="391" width="26" height="7" rx="3" transform="rotate(-6 171 394)"/>
      <rect class="birch-mark" x="164" y="345" width="18" height="6" rx="3" transform="rotate(8 173 348)"/>
      <rect class="birch-mark" x="151" y="299" width="29" height="7" rx="3" transform="rotate(-5 165 302)"/>
      <rect class="birch-mark" x="174" y="252" width="18" height="6" rx="3" transform="rotate(7 183 255)"/>
      <rect class="birch-mark" x="159" y="215" width="23" height="6" rx="3" transform="rotate(-8 170 218)"/>
      <path class="birch-canopy" d="M63 240C39 219 37 184 55 160C40 131 52 99 77 84C76 53 100 30 128 31C146 7 181 1 206 18C231 4 264 14 278 40C307 41 329 63 328 91C352 104 361 135 347 158C363 181 357 215 334 232C337 260 313 285 284 286C267 311 233 320 207 307C181 328 144 322 126 297C97 303 68 282 65 253C60 249 59 244 63 240Z"/>
      <path class="birch-canopy-shadow" d="M55 160C64 192 94 215 126 219C109 237 103 261 126 297C97 303 68 282 65 253C60 249 59 244 63 240C39 219 37 184 55 160Z"/>
      <path class="birch-canopy-light" d="M95 84C114 51 151 41 181 51C158 62 144 79 137 102C121 93 107 87 95 84Z"/>
    </svg>`;
}

function oreNodeSvg(typeKey) {
  const geodeCrystals = typeKey === 'geode' ? `
    <path d="M129 142L145 100L160 142Z" fill="#e3dcf1" opacity=".92"/>
    <path d="M155 145L174 91L189 145Z" fill="#a88ac8" opacity=".9"/>
    <path d="M181 148L197 111L209 148Z" fill="#d8c8ea" opacity=".85"/>` : '';

  return `
    <svg class="ore-node-art" viewBox="0 0 320 240" aria-hidden="true">
      <ellipse cx="160" cy="214" rx="108" ry="18" fill="rgba(0,0,0,.22)"/>
      <path d="M50 190L69 115L111 79L164 62L221 79L270 127L277 190L246 211H79Z" fill="#666d69"/>
      <path d="M69 115L111 79L142 91L116 134L50 190Z" fill="#858b87" opacity=".72"/>
      <path d="M164 62L221 79L198 120L142 91Z" fill="#929792" opacity=".58"/>
      <path d="M221 79L270 127L233 151L198 120Z" fill="#505753" opacity=".8"/>
      <path d="M116 134L142 91L198 120L174 164Z" fill="#747b76"/>
      <path d="M174 164L198 120L233 151L246 211L188 202Z" fill="#555c58"/>
      <path d="M116 134L174 164L188 202L79 211L50 190Z" fill="#636a66"/>
      <g class="ore-veins" fill="none" stroke="var(--ore-color)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M93 167L125 145L151 159L178 128"/>
        <path d="M192 174L216 153L238 163"/>
        <path d="M145 105L164 91L182 112"/>
      </g>
      ${geodeCrystals}
    </svg>`;
}

function mapSvg() {
  return `
    <svg viewBox="0 0 1000 650" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="lake" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#91c8cc"/>
          <stop offset="1" stop-color="#5b98a1"/>
        </linearGradient>
        <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#afc88a"/>
          <stop offset="1" stop-color="#759469"/>
        </linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="1.5"/></filter>
      </defs>
      <rect width="1000" height="650" fill="url(#land)"/>
      <g opacity=".28" fill="none" stroke="#526f54" stroke-width="2">
        <path d="M-20 98C120 48 225 73 330 122S553 197 709 128S910 58 1030 95"/>
        <path d="M-40 145C126 95 259 125 364 172S587 236 744 171S921 111 1040 141"/>
        <path d="M-20 523C111 469 239 482 343 528S586 597 752 528S916 470 1030 510"/>
        <path d="M26 570C163 526 273 541 373 581S594 627 725 586S911 531 1008 560"/>
      </g>
      <path d="M295 268C351 221 432 216 494 245C557 274 636 264 682 310C728 356 694 425 628 449C561 474 489 442 422 462C354 481 279 455 259 396C240 338 249 307 295 268Z" fill="url(#lake)"/>
      <path d="M322 304C388 267 436 275 483 295" fill="none" stroke="rgba(255,255,255,.38)" stroke-width="6" stroke-linecap="round"/>
      <path d="M520 425C570 414 610 391 630 365" fill="none" stroke="rgba(255,255,255,.24)" stroke-width="5" stroke-linecap="round"/>
      <g fill="#3f7147" opacity=".9">
        ${forestMapTrees()}
      </g>
      <g fill="#726e63" opacity=".86">
        <path d="M708 154L773 54L836 157Z"/><path d="M773 54L798 112L753 113Z" fill="#d7d4c7" opacity=".7"/>
        <path d="M786 181L866 73L945 184Z"/><path d="M866 73L892 124L839 125Z" fill="#d7d4c7" opacity=".65"/>
        <path d="M646 194L706 103L764 196Z"/>
      </g>
      <path d="M227 225C342 219 438 239 523 287C604 334 678 322 795 278" fill="none" stroke="#806b4d" stroke-width="7" stroke-linecap="round" stroke-dasharray="4 14" opacity=".52"/>
      <path d="M485 468C571 502 677 491 782 431" fill="none" stroke="#806b4d" stroke-width="6" stroke-linecap="round" stroke-dasharray="4 14" opacity=".42"/>
      <path d="M632 447C694 470 741 487 820 503" fill="none" stroke="#806b4d" stroke-width="6" stroke-linecap="round" stroke-dasharray="4 14" opacity=".44"/>
      <g transform="translate(754 444)" opacity=".9">
        <rect x="0" y="30" width="44" height="34" rx="3" fill="#b88d5e"/>
        <path d="M-5 31L22 9L49 31Z" fill="#7a4e3a"/>
        <rect x="58" y="21" width="50" height="40" rx="3" fill="#c4a074"/>
        <path d="M53 23L83 -2L113 23Z" fill="#685048"/>
        <rect x="116" y="34" width="40" height="30" rx="3" fill="#9a7956"/>
        <path d="M112 35L136 15L160 35Z" fill="#5a4b42"/>
        <rect x="72" y="43" width="11" height="18" fill="#684631"/>
      </g>
      <g opacity=".22" filter="url(#soft)" fill="#223f2a">
        <ellipse cx="184" cy="222" rx="126" ry="53"/><ellipse cx="858" cy="196" rx="112" ry="46"/>
      </g>
    </svg>`;
}

function forestMapTrees() {
  const points = [
    [95,150],[130,192],[167,136],[204,176],[238,126],[112,258],[160,286],[215,250],
    [255,209],[89,342],[145,367],[215,340],[278,330],[160,444],[232,427],[93,465],
    [348,109],[391,137],[427,98],[466,132],[525,110],[575,148]
  ];
  return points.map(([x,y], i) => `<path d="M${x} ${y+40}L${x+18} ${y+7}L${x+10} ${y+9}L${x+25} ${y-18}L${x+40} ${y+9}L${x+32} ${y+7}L${x+50} ${y+40}Z" opacity="${.62 + (i%4)*.08}"/>`).join('');
}

function chevronSvg() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 9.5L12 15l5.5-5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function bagSvg() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8.5h11l1.2 11H5.3l1.2-11Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 9V7a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
}

export { oakSvg, birchSvg, oreNodeSvg, mapSvg, chevronSvg, bagSvg };
