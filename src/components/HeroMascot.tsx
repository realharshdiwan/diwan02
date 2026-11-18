import { useState } from 'react';
import { HERO_MASCOT, resolveMascotRenderMode } from '@/src/lib/site';

export function HeroMascot() {
  const [imageError, setImageError] = useState(false);
  const mode = resolveMascotRenderMode(HERO_MASCOT.imageSrc, imageError);

  if (mode === 'image') {
    return (
      <img
        src={HERO_MASCOT.imageSrc}
        alt={HERO_MASCOT.alt}
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
        className="h-[225px] w-auto max-w-full select-none object-contain sm:h-[265px] lg:h-[clamp(255px,36vh,345px)]"
      />
    );
  }

  return (
    <svg
      role="img"
      aria-label={HERO_MASCOT.alt}
      viewBox="0 0 360 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-[210px] w-auto max-w-full select-none sm:h-[245px] lg:h-[clamp(235px,33vh,320px)]"
    >
      {/* Grounded warm clay earth shadow */}
      <ellipse cx="182" cy="259" rx="116" ry="9" fill="#ebe5d8" />

      {/* Off foreleg (weight-bearing, dark depth silhouette) */}
      <path
        d="M140 166L136 211L136 242L126 252L144 252L146 211L152 168Z"
        fill="#1d1915"
        stroke="#1d1915"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Off hindleg (weight-bearing forward, dark depth silhouette) */}
      <path
        d="M236 170L241 208L233 242L223 251L241 251L249 208L247 166Z"
        fill="#1d1915"
        stroke="#1d1915"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Flowing ceremonial tail with terracotta band & wave striations */}
      <path
        d="M266 124C288 122 308 138 310 171C312 195 303 215 292 227C289 206 291 180 280 156C275 145 268 139 261 136Z"
        fill="#1d1915"
        stroke="#1d1915"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <path
        d="M276 135C293 144 301 168 298 202"
        stroke="#f5f1e8"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="6 5"
      />
      <path
        d="M263 128L276 131L274 139L261 136Z"
        fill="#b84121"
        stroke="#1d1915"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Far Marwari ear (gracefully curving inward behind near ear) */}
      <path
        d="M113 48C116 33 114 23 107 25C105 26 105 32 106 42"
        fill="#ebe5d8"
        stroke="#1d1915"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Braided & jeweled crest mane along arched neck */}
      <path
        d="M114 48C130 55 144 74 155 103"
        stroke="#1d1915"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M120 53L128 48L127 59Z"
        fill="#b84121"
        stroke="#1d1915"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M129 63L138 59L136 70Z"
        fill="#1d1915"
        stroke="#1d1915"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M138 75L147 72L144 83Z"
        fill="#b84121"
        stroke="#1d1915"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M145 88L154 86L150 97Z"
        fill="#1d1915"
        stroke="#1d1915"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Main Marwari stallion silhouette: noble head, arched neck, chest, barrel, croup */}
      <path
        d="M91 49C95 43 105 43 113 48C127 56 142 78 156 112C175 117 195 118 214 115C236 112 260 114 268 128C274 140 272 162 263 176C255 178 242 178 232 175C204 183 166 184 134 176C116 172 108 156 110 134C112 114 114 96 104 83C98 76 92 84 82 88C71 92 60 91 57 85C54 79 62 72 72 64C81 57 86 55 91 49Z"
        fill="#fffdf9"
        stroke="#1d1915"
        strokeWidth="2.3"
        strokeLinejoin="round"
      />

      {/* Near foreleg lifted in collected royal parade step (knee forward, cannon vertical) */}
      <path
        d="M122 155L103 185C100 190 100 195 103 199L114 222L123 220L115 194L135 166"
        fill="#fffdf9"
        stroke="#1d1915"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lifted forehoof */}
      <path
        d="M111 221L123 219L122 229L105 230Z"
        fill="#1d1915"
        stroke="#1d1915"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Near hindleg (muscular gaskin, crisp rear hock, vertical cannon) */}
      <path
        d="M236 164C239 178 244 190 256 206C258 209 258 214 256 219L254 244L265 244L268 208C269 194 266 180 264 166"
        fill="#fffdf9"
        stroke="#1d1915"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Planted rear hoof */}
      <path
        d="M253 243L266 243L267 254L246 254Z"
        fill="#1d1915"
        stroke="#1d1915"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Ceremonial terracotta ghungroo anklets */}
      <rect
        x="110"
        y="212"
        width="12"
        height="5.5"
        rx="1.5"
        transform="rotate(-10 110 212)"
        fill="#b84121"
        stroke="#1d1915"
        strokeWidth="1.8"
      />
      <rect
        x="253"
        y="234"
        width="13"
        height="5.5"
        rx="1.5"
        fill="#b84121"
        stroke="#1d1915"
        strokeWidth="1.8"
      />

      {/* Near signature inward-curving Marwari lyre ear */}
      <path
        d="M99 47C98 33 102 22 110 23C107 28 106 36 108 46Z"
        fill="#fffdf9"
        stroke="#1d1915"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Royal kalgi forehead plume (cleanly clear of ears) */}
      <path
        d="M90 48C81 36 71 29 59 31C67 37 75 43 85 50"
        fill="#b84121"
        stroke="#1d1915"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle
        cx="90"
        cy="49"
        r="4"
        fill="#fffdf9"
        stroke="#1d1915"
        strokeWidth="1.9"
      />

      {/* Terracotta ceremonial bridle, cheek strap & stud bosses */}
      <path
        d="M62 76L73 86M90 52L72 82L98 73L106 50"
        stroke="#b84121"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="72"
        cy="82"
        r="2.6"
        fill="#fffdf9"
        stroke="#1d1915"
        strokeWidth="1.6"
      />
      <circle
        cx="98"
        cy="73"
        r="2.6"
        fill="#fffdf9"
        stroke="#1d1915"
        strokeWidth="1.6"
      />
      {/* Sweeping rein back to saddle pommel */}
      <path
        d="M73 83C96 106 124 118 158 117"
        stroke="#1d1915"
        strokeWidth="1.9"
        strokeLinecap="round"
      />

      {/* Expressive eye & sculpted nostril */}
      <circle cx="85" cy="60" r="2.3" fill="#1d1915" />
      <path
        d="M80 57C83 54.5 88 54.5 91 56.5"
        stroke="#1d1915"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="63" cy="83" r="1.6" fill="#1d1915" />

      {/* Girth strap hugging barrel under saddle cloth */}
      <path
        d="M172 168V182"
        stroke="#1d1915"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Ceremonial kantha chest collar with scalloped tassels */}
      <path
        d="M111 116C124 134 143 139 159 128"
        stroke="#b84121"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M111 116C124 134 143 139 159 128"
        stroke="#1d1915"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="1.5 6"
      />
      <circle cx="117" cy="133" r="3.4" fill="#b84121" stroke="#1d1915" strokeWidth="1.7" />
      <circle cx="130" cy="141" r="3.4" fill="#fffdf9" stroke="#1d1915" strokeWidth="1.7" />
      <circle cx="144" cy="141" r="3.4" fill="#b84121" stroke="#1d1915" strokeWidth="1.7" />
      <circle cx="155" cy="136" r="3" fill="#fffdf9" stroke="#1d1915" strokeWidth="1.7" />

      {/* Ornate Marwari ceremonial jhul (saddle blanket) with scalloped hem */}
      <path
        d="M156 112C176 116 202 116 226 113L233 162C225 168 218 168 212 162C205 168 197 168 191 162C184 168 176 168 170 162C164 168 156 168 150 161Z"
        fill="#b84121"
        stroke="#1d1915"
        strokeWidth="2.3"
        strokeLinejoin="round"
      />

      {/* Royal raised-pommel saddle seat */}
      <path
        d="M159 111C166 105 173 108 178 115C188 120 202 120 212 114C217 108 223 107 226 113L222 127C204 132 180 132 162 126Z"
        fill="#fffdf9"
        stroke="#1d1915"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />

      {/* Geometric border trim & central royal diamond on jhul */}
      <path
        d="M156 154C166 157 216 157 227 154"
        stroke="#fffdf9"
        strokeWidth="1.9"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      <path
        d="M191 133L199 141L191 149L183 141Z"
        fill="#fffdf9"
        stroke="#1d1915"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="191" cy="141" r="2.1" fill="#b84121" />
    </svg>
  );
}
