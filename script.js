(function(){
  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, reduce ? Math.min(ms, 30) : ms));
  const TAU = Math.PI * 2;
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  const lerp = (a,b,t) => a + (b-a)*t;
  const ease = t => t*t*(3-2*t);
  const backOut = t => { const c = 1.6; t -= 1; return 1 + (c+1)*t*t*t + c*t*t; };
  function rng(seed){ return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

  /* ---------- colour helpers ---------- */
  const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const mixRGB = (a,b,t) => a.map((v,i) => Math.round(v + (b[i]-v)*t));
  const css = (c,a=1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  function tone(h){
    const b = hex(h);
    return { base:b, dark:mixRGB(b,[60,0,30],.45), deep:mixRGB(b,[40,0,20],.65), light:mixRGB(b,[255,255,255],.45), pale:mixRGB(b,[255,250,245],.75) };
  }

  function swap(from, to){
    from.classList.add('leaving');
    return wait(380).then(() => {
      from.hidden = true; from.classList.remove('leaving');
      to.hidden = false; to.classList.remove('entering'); void to.offsetWidth; to.classList.add('entering');
    });
  }
  $('noBtn').addEventListener('click', () => swap($('ask'), $('nope')));
  $('backBtn').addEventListener('click', () => swap($('nope'), $('ask')));
  $('yesBtn').addEventListener('click', () => { $('yesBtn').disabled = true; flowerStorm(); });

  /* =========================================================
     Flower painting (shared by the bouquet and the storm)
     ========================================================= */
  function petalPath(x, len, w, tip=1.15){
    x.beginPath(); x.moveTo(0,0);
    x.bezierCurveTo(w, -len*.12, w*tip, -len*.82, 0, -len);
    x.bezierCurveTo(-w*tip, -len*.82, -w, -len*.12, 0, 0);
    x.closePath();
  }
  function lightOver(x, R){
    x.globalCompositeOperation = 'source-atop';
    const g = x.createRadialGradient(-R*.45, -R*.55, 0, -R*.2, -R*.2, R*1.7);
    g.addColorStop(0, 'rgba(255,255,240,.28)');
    g.addColorStop(.45, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(50,0,25,.32)');
    x.fillStyle = g; x.fillRect(-R*1.3, -R*1.3, R*2.6, R*2.6);
    x.globalCompositeOperation = 'source-over';
  }

  const PAINT = {
    rose(x, R, c, r){
      const rings = [[6,1,.5,0],[5,.84,.46,.5],[5,.66,.42,.2],[4,.5,.38,.9]];
      rings.forEach(([n,len,w,rot]) => {
        for (let i=0;i<n;i++){
          x.save(); x.rotate(i/n*TAU + rot + (r()-.5)*.25);
          const g = x.createLinearGradient(0,0,0,-R*len);
          g.addColorStop(0, css(c.deep)); g.addColorStop(.5, css(c.base)); g.addColorStop(.92, css(c.light)); g.addColorStop(1, css(c.pale));
          x.fillStyle = g; petalPath(x, R*len, R*w*(.9+r()*.2)); x.fill();
          x.strokeStyle = css(c.pale,.55); x.lineWidth = R*.018; x.stroke();
          x.restore();
        }
      });
      const g = x.createRadialGradient(0,0,0,0,0,R*.4);
      g.addColorStop(0, css(c.deep)); g.addColorStop(1, css(c.base));
      x.fillStyle = g; x.beginPath(); x.arc(0,0,R*.38,0,TAU); x.fill();
      for (let j=0;j<7;j++){
        const rr = R*(.36 - j*.048), st = j*1.25 + r();
        x.beginPath(); x.arc(R*.01*j, R*.008*j, rr, st, st+3.4);
        x.strokeStyle = css(c.deep,.85); x.lineWidth = R*.05; x.stroke();
        x.beginPath(); x.arc(R*.01*j, R*.008*j, rr+R*.018, st+.3, st+3.1);
        x.strokeStyle = css(c.light,.75); x.lineWidth = R*.022; x.stroke();
      }
    },
    peony(x, R, c, r){
      for (let k=0;k<5;k++){
        const n = 12 - k, rr = R*(1 - k*.17);
        for (let i=0;i<n;i++){
          const a = i/n*TAU + k*.45 + (r()-.5)*.3, d = rr*.45;
          x.save(); x.translate(Math.cos(a)*d, Math.sin(a)*d); x.rotate(a);
          const g = x.createRadialGradient(-rr*.4,0,0,0,0,rr*.6);
          g.addColorStop(0, css(c.dark)); g.addColorStop(.55, css(c.base)); g.addColorStop(1, css(c.pale));
          x.fillStyle = g;
          x.beginPath(); x.ellipse(0,0, rr*.5*(.9+r()*.2), rr*.36*(.9+r()*.2), 0, 0, TAU); x.fill();
          x.strokeStyle = css(c.pale,.6); x.lineWidth = R*.015; x.stroke();
          x.restore();
        }
      }
      for (let i=0;i<14;i++){ const a=r()*TAU, d=r()*R*.12; x.fillStyle='#ffd56b'; x.beginPath(); x.arc(Math.cos(a)*d,Math.sin(a)*d,R*.03,0,TAU); x.fill(); }
      for (let i=0;i<4;i++){ x.save(); x.rotate(i*1.6); x.fillStyle = css(c.base); x.beginPath(); x.ellipse(R*.06,0,R*.12,R*.07,0,0,TAU); x.fill(); x.restore(); }
    },
    gerbera(x, R, c, r){
      [[26,1,.1,0],[26,.78,.085,.12]].forEach(([n,len,w,rot],k) => {
        for (let i=0;i<n;i++){
          x.save(); x.rotate(i/n*TAU + rot + (r()-.5)*.06);
          const L = R*len*(.94+r()*.1);
          const g = x.createLinearGradient(0,0,0,-L);
          g.addColorStop(0, css(c.deep)); g.addColorStop(.3, css(c.dark)); g.addColorStop(.55, css(c.base)); g.addColorStop(1, css(k ? c.base : c.light));
          x.fillStyle = g; petalPath(x, L, R*w, 1.25); x.fill();
          x.strokeStyle = css(c.deep,.25); x.lineWidth = R*.01;
          x.beginPath(); x.moveTo(0,-L*.2); x.lineTo(0,-L*.92); x.stroke();
          x.restore();
        }
      });
      let g = x.createRadialGradient(0,0,0,0,0,R*.32);
      g.addColorStop(0,'#2a1a0a'); g.addColorStop(.55,'#4d3410'); g.addColorStop(.75,'#c98d16'); g.addColorStop(1,'#ffcf3a');
      x.fillStyle = g; x.beginPath(); x.arc(0,0,R*.32,0,TAU); x.fill();
      for (let i=0;i<70;i++){ const a=r()*TAU, d=R*(.19+r()*.12); x.fillStyle = r()>.4 ? 'rgba(255,224,110,.9)' : 'rgba(120,70,10,.8)'; x.beginPath(); x.arc(Math.cos(a)*d,Math.sin(a)*d,R*.018,0,TAU); x.fill(); }
    },
    chamomile(x, R, c, r){
      for (let i=0;i<22;i++){
        x.save(); x.rotate(i/22*TAU + (r()-.5)*.1);
        const g = x.createLinearGradient(0,0,0,-R);
        g.addColorStop(0,'#cfcad8'); g.addColorStop(.35,'#f6f3fa'); g.addColorStop(1,'#ffffff');
        x.fillStyle = g; petalPath(x, R*(.9+r()*.12), R*.13, 1.3); x.fill();
        x.strokeStyle = 'rgba(150,140,170,.35)'; x.lineWidth = R*.012; x.stroke();
        x.restore();
      }
      const g = x.createRadialGradient(-R*.08,-R*.1,0,0,0,R*.3);
      g.addColorStop(0,'#fff27a'); g.addColorStop(.6,'#ffc21a'); g.addColorStop(1,'#d48a00');
      x.fillStyle = g; x.beginPath(); x.arc(0,0,R*.29,0,TAU); x.fill();
      for (let i=0;i<50;i++){ const a=r()*TAU, d=r()*R*.26; x.fillStyle='rgba(180,110,0,.45)'; x.beginPath(); x.arc(Math.cos(a)*d,Math.sin(a)*d,R*.015,0,TAU); x.fill(); }
    },
    ranunculus(x, R, c, r){
      for (let k=0;k<8;k++){
        const n = 10, rr = R*(1 - k*.115);
        for (let i=0;i<n;i++){
          const a = i/n*TAU + k*.33 + (r()-.5)*.2, d = rr*.52;
          x.save(); x.translate(Math.cos(a)*d, Math.sin(a)*d); x.rotate(a);
          const g = x.createLinearGradient(-rr*.3,0,rr*.3,0);
          g.addColorStop(0, css(c.dark)); g.addColorStop(.6, css(c.base)); g.addColorStop(1, css(c.light));
          x.fillStyle = g; x.beginPath(); x.ellipse(0,0, rr*.3, rr*.42, 0, 0, TAU); x.fill();
          x.strokeStyle = css(c.deep,.25); x.lineWidth = R*.012; x.stroke();
          x.restore();
        }
      }
      const g = x.createRadialGradient(0,0,0,0,0,R*.13);
      g.addColorStop(0,'#5d7a2a'); g.addColorStop(1,'#a8c060');
      x.fillStyle = g; x.beginPath(); x.arc(0,0,R*.12,0,TAU); x.fill();
    },
    hydrangea(x, R, c, r){
      const pts = [];
      for (let i=0;i<46;i++){ const a=r()*TAU, d=Math.sqrt(r())*R*.78; pts.push([Math.cos(a)*d, Math.sin(a)*d*.92]); }
      pts.sort((p,q) => p[1]-q[1]);
      const alt = tone('#b79cff');
      pts.forEach(([px,py]) => {
        x.save(); x.translate(px,py); x.rotate(r()*TAU);
        const s = R*(.17 + r()*.05), cc = r() > .5 ? c : alt;
        for (let k=0;k<4;k++){
          x.save(); x.rotate(k*TAU/4);
          const g = x.createRadialGradient(0,-s*.25,0,0,-s*.45,s*.6);
          g.addColorStop(0, css(cc.pale)); g.addColorStop(.6, css(cc.base)); g.addColorStop(1, css(cc.dark));
          x.fillStyle = g; x.beginPath(); x.ellipse(0,-s*.45,s*.36,s*.46,0,0,TAU); x.fill();
          x.restore();
        }
        x.fillStyle = css(cc.deep); x.beginPath(); x.arc(0,0,s*.09,0,TAU); x.fill();
        x.restore();
      });
    },
    tulip(x, R, c, r){
      const back = new Path2D(`M${-.5*R} ${-.05*R} C${-.56*R} ${-.75*R} ${-.12*R} ${-.98*R} 0 ${-.8*R} C${.12*R} ${-.98*R} ${.56*R} ${-.75*R} ${.5*R} ${-.05*R} C${.45*R} ${.5*R} ${-.45*R} ${.5*R} ${-.5*R} ${-.05*R}Z`);
      let g = x.createLinearGradient(0,R*.5,0,-R);
      g.addColorStop(0, css(c.deep)); g.addColorStop(.6, css(c.dark)); g.addColorStop(1, css(c.base));
      x.fillStyle = g; x.fill(back);
      const left = new Path2D(`M${-.5*R} ${-.02*R} C${-.52*R} ${-.62*R} ${-.22*R} ${-.95*R} ${.04*R} ${-.78*R} C${.22*R} ${-.42*R} ${.24*R} ${.2*R} ${.08*R} ${.44*R} C${-.22*R} ${.44*R} ${-.48*R} ${.3*R} ${-.5*R} ${-.02*R}Z`);
      const right = new Path2D(`M${.5*R} ${-.02*R} C${.52*R} ${-.62*R} ${.22*R} ${-.95*R} ${-.04*R} ${-.78*R} C${-.22*R} ${-.42*R} ${-.24*R} ${.2*R} ${-.08*R} ${.44*R} C${.22*R} ${.44*R} ${.48*R} ${.3*R} ${.5*R} ${-.02*R}Z`);
      g = x.createLinearGradient(-R*.5,0,R*.3,0);
      g.addColorStop(0, css(c.dark)); g.addColorStop(.6, css(c.base)); g.addColorStop(1, css(c.light));
      x.fillStyle = g; x.fill(left);
      g = x.createLinearGradient(R*.5,0,-R*.2,0);
      g.addColorStop(0, css(c.dark)); g.addColorStop(.5, css(c.base)); g.addColorStop(1, css(c.light));
      x.fillStyle = g; x.fill(right);
      x.strokeStyle = css(c.pale,.5); x.lineWidth = R*.02; x.stroke(left); x.stroke(right);
    },
    petal(x, R, c, r){
      x.rotate(r()*TAU);
      const g = x.createLinearGradient(0,R*.6,0,-R*.7);
      g.addColorStop(0, css(c.dark)); g.addColorStop(.5, css(c.base)); g.addColorStop(1, css(c.light));
      x.fillStyle = g; x.translate(0,R*.55); petalPath(x, R*1.2, R*.6, 1.2); x.fill();
      x.strokeStyle = css(c.pale,.5); x.lineWidth = R*.03; x.stroke();
    }
  };

  // bake one flower into a canvas with its own soft shadow
  function flowerSprite(type, color, Rpx, seed){
    const r = rng(seed);
    const c = tone(color);
    const S = Math.ceil(Rpx*2.4);
    const tmp = document.createElement('canvas'); tmp.width = tmp.height = S;
    const x = tmp.getContext('2d'); x.translate(S/2, S/2);
    PAINT[type](x, Rpx, c, r);
    if (type !== 'petal') lightOver(x, Rpx);
    const pad = Math.ceil(Rpx*.35);
    const out = document.createElement('canvas'); out.width = out.height = S + pad*2;
    const o = out.getContext('2d');
    o.shadowColor = 'rgba(60,10,30,.38)'; o.shadowBlur = Rpx*.18; o.shadowOffsetX = Rpx*.05; o.shadowOffsetY = Rpx*.1;
    o.drawImage(tmp, pad, pad);
    return out; // centre of flower = centre of canvas; radius Rpx
  }

  const COLORS = {
    rose:['#ff3f8e','#ff6b4a','#f0304f','#ffb38a','#ff8fb8'],
    peony:['#ff8fb8','#ffb3c7','#ff6f8e','#ffa07a'],
    gerbera:['#ff9a1f','#ffd23f','#ff5a3c','#e0249a','#ff7eb6'],
    chamomile:['#ffffff'],
    ranunculus:['#ff7a3d','#ffcc33','#e0249a','#ff5c7a'],
    hydrangea:['#8db8ff','#b79cff'],
    tulip:['#ff3b5c','#b06bf0','#ff9a1f']
  };

  /* =========================================================
     Falling flowers
     ========================================================= */
  function flowerStorm(){
    const cv = $('petals');
    if (reduce){ showGift(); return; }
    cv.hidden = false; cv.style.opacity = 1;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = innerWidth, H = innerHeight;
    cv.width = W*dpr; cv.height = H*dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr,dpr);
    const base = Math.max(56, Math.min(W,H)*.15);
    const Rpx = Math.round(base*.62*dpr);
    const kinds = ['rose','rose','peony','peony','gerbera','gerbera','chamomile','ranunculus','tulip','hydrangea','petal'];
    const sprites = [];
    let seed = 7;
    kinds.forEach(k => {
      const list = k === 'petal' ? ['#ff3f8e','#ffb3c7','#ff9a1f','#ffd23f'] : COLORS[k];
      list.forEach(col => sprites.push({k, img: flowerSprite(k, col, k === 'petal' ? Rpx*.45 : Rpx, seed += 101)}));
    });
    const R = Math.random;
    const count = Math.min(900, Math.ceil(W*H/(base*base) * 5.5));
    const FILL = 2500, HOLD = 700;
    const items = [];
    for (let i=0;i<count;i++){
      const t = i/count;
      const sp = sprites[Math.floor(R()*sprites.length)];
      const size = base*(.8 + R()*.75) * (sp.k === 'petal' ? .55 : 1);
      items.push({
        img: sp.img, x: R()*(W+size) - size/2,
        start: t*FILL*.88 + R()*140,
        restY: H + size*.1 - t*(H + size*.55) + (R()-.5)*size*.7,
        size: size*1.36, rot: R()*TAU, vr: (R()-.5)*.02, sway: R()*TAU, vy: 1.2 + R()*.9
      });
    }
    let t0 = performance.now(), swapped = false, fading = false, fadeAt = 0;
    function frame(now){
      const t = now - t0;
      ctx.clearRect(0,0,W,H);
      // the bed of the pile: fills every gap so the screen is fully buried
      const prog = clamp((t - 250)/FILL, 0, 1.08);
      const drop = fading ? (t - fadeAt)*1.1 : 0;
      const bedTop = H - prog*(H + base) + base*.75 + drop;
      if (bedTop < H){
        const g = ctx.createLinearGradient(0, bedTop, 0, bedTop + Math.max(H*.5, 200));
        g.addColorStop(0,'rgba(196,60,110,0)'); g.addColorStop(.06,'#c23f72'); g.addColorStop(1,'#8f2350');
        ctx.fillStyle = g; ctx.fillRect(0, bedTop, W, H - bedTop);
      }
      for (const p of items){
        if (t < p.start) continue;
        const life = t - p.start;
        let y = -p.size + life*p.vy;
        const landed = y >= p.restY;
        if (landed) y = p.restY;
        if (fading) y += (t - fadeAt) * .9 * (.5 + p.vy*.4);
        const x = p.x + (landed ? 0 : Math.sin(life*.004 + p.sway)*14);
        const r = p.rot + (landed ? (p.restY+p.size)/p.vy : life)*p.vr;
        ctx.save(); ctx.translate(x,y); ctx.rotate(r);
        ctx.drawImage(p.img, -p.size/2, -p.size/2, p.size, p.size);
        ctx.restore();
      }
      if (!swapped && t > FILL + 250 + HOLD){ swapped = true; showGift(); fading = true; fadeAt = t; cv.style.opacity = 0; }
      if (fading && t - fadeAt > 1300){ cv.hidden = true; ctx.clearRect(0,0,W,H); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* =========================================================
     The room: wall, table, glass vase, bouquet, cat
     ========================================================= */
  const room = $('room');
  const rctx = room.getContext('2d');
  const catImg = $('catImg');
  let L = null;          // layout
  let bgCache = null;    // wall + table
  let bouquet = null;    // bouquet description
  let bouquetCache = null;
  let t0 = 0, running = false;

  function layout(){
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = innerWidth, H = innerHeight;
    room.width = Math.round(W*dpr); room.height = Math.round(H*dpr);
    const sr = $('stage').getBoundingClientRect();
    const u = sr.width;
    const ground = sr.top + sr.height*.975;
    const bw = u*.70, s = bw/400;
    L = { dpr, W, H, u, left: sr.left, ground, tableY: ground - u*.2,
          bx: sr.left - u*.03, by: ground - 550*s, s,
          cat: { x: sr.left + u*.60, w: u*.42, h: u*.42*800/557 } };
    bgCache = paintBackground();
    bouquetCache = null;
  }

  function paintBackground(){
    const {dpr, W, H, tableY} = L;
    const c = document.createElement('canvas'); c.width = W*dpr; c.height = H*dpr;
    const x = c.getContext('2d'); x.scale(dpr,dpr);
    // wall
    let g = x.createLinearGradient(0,0,0,tableY);
    g.addColorStop(0,'#f7e1d8'); g.addColorStop(1,'#eec6bb');
    x.fillStyle = g; x.fillRect(0,0,W,tableY);
    g = x.createRadialGradient(W*.12, H*.05, 0, W*.12, H*.05, Math.max(W,H)*.85);
    g.addColorStop(0,'rgba(255,248,225,.75)'); g.addColorStop(.5,'rgba(255,240,220,.18)'); g.addColorStop(1,'rgba(255,240,220,0)');
    x.fillStyle = g; x.fillRect(0,0,W,tableY);
    // soft window light patch on the wall
    x.save(); x.globalAlpha = .18; x.fillStyle = '#fff6e0';
    x.beginPath(); x.moveTo(W*.02, tableY*.12); x.lineTo(W*.32, tableY*.08); x.lineTo(W*.36, tableY*.62); x.lineTo(W*.05, tableY*.7); x.closePath(); x.fill();
    x.restore();
    const rr = rng(99);
    for (let i=0;i<Math.min(9000, W*H/60);i++){ x.fillStyle = rr() > .5 ? 'rgba(255,255,255,.035)' : 'rgba(120,60,50,.03)'; x.fillRect(rr()*W, rr()*tableY, 1.4, 1.4); }
    // shadow line where wall meets table
    g = x.createLinearGradient(0,tableY-18,0,tableY);
    g.addColorStop(0,'rgba(90,40,30,0)'); g.addColorStop(1,'rgba(90,40,30,.18)');
    x.fillStyle = g; x.fillRect(0,tableY-18,W,18);
    // wooden table
    g = x.createLinearGradient(0,tableY,0,H);
    g.addColorStop(0,'#d7a77c'); g.addColorStop(.35,'#c48c5e'); g.addColorStop(1,'#9c6640');
    x.fillStyle = g; x.fillRect(0,tableY,W,H-tableY);
    const wr = rng(4242);
    const depth = H - tableY;
    for (let i=0;i<140;i++){
      const f = Math.pow(wr(), 1.4);
      const y0 = tableY + f*depth;
      const amp = 1 + wr()*3*(1+f*2), freq = .004 + wr()*.01, ph = wr()*TAU;
      x.beginPath();
      for (let X=-10; X<=W+10; X+=8){ const Y = y0 + Math.sin(X*freq+ph)*amp + Math.sin(X*freq*3.1+ph)*amp*.3; X<=-10 ? x.moveTo(X,Y) : x.lineTo(X,Y); }
      x.strokeStyle = wr() > .45 ? `rgba(90,45,20,${.06+wr()*.12})` : `rgba(255,220,180,${.05+wr()*.08})`;
      x.lineWidth = .6 + wr()*(1+f*2.2); x.stroke();
    }
    // table edge highlight + window light on the table
    x.fillStyle = 'rgba(255,240,220,.45)'; x.fillRect(0,tableY,W,1.5);
    g = x.createRadialGradient(W*.25, tableY+depth*.3, 0, W*.25, tableY+depth*.3, W*.7);
    g.addColorStop(0,'rgba(255,240,210,.22)'); g.addColorStop(1,'rgba(255,240,210,0)');
    x.fillStyle = g; x.fillRect(0,tableY,W,depth);
    return c;
  }

  /* ---------- bouquet ---------- */
  function planBouquet(){
    const r = rng(20261004);
    const flowers = [];
    const types = ['rose','rose','peony','gerbera','gerbera','chamomile','ranunculus','tulip','rose','peony','ranunculus','gerbera'];
    let tries = 0;
    while (flowers.length < 34 && tries < 5000){
      tries++;
      const x = 25 + r()*350, y = 40 + r()*290;
      const dx = (x-200)/178, dy = (y-205)/170;
      if (dx*dx + dy*dy > 1) continue;
      if (y > 315 && Math.abs(x-200) > 115) continue;
      const big = r() < .12;
      const type = big ? 'hydrangea' : types[Math.floor(r()*types.length)];
      const R = big ? 50 + r()*10 : 30 + r()*20;
      if (flowers.some(p => Math.hypot(p.x-x,p.y-y) < (p.R+R)*.66)) continue;
      const cols = COLORS[type];
      flowers.push({x, y, R, type, color: cols[Math.floor(r()*cols.length)], rot:(r()-.5)*.9, seed: Math.floor(r()*1e9)});
    }
    flowers.sort((a,b) => a.y - b.y);
    flowers.forEach((f,i) => f.delay = .25 + i*.042);
    const leaves = [];
    for (let i=0;i<22;i++){
      const a = -Math.PI/2 + (i-10.5)*.15 + (r()-.5)*.12;
      leaves.push({a, len: 150 + r()*95, w: 16 + r()*12, dark: r() > .5, delay: .05 + i*.025, euc: i%4 === 1});
    }
    const gyp = [];
    for (let i=0;i<70;i++){
      const a = -Math.PI/2 + (r()-.5)*2.6, d = 165 + r()*45;
      gyp.push({x: 200 + Math.cos(a)*d, y: 215 + Math.sin(a)*d*.95, r: 2 + r()*2.2});
    }
    return {flowers, leaves, gyp, sprites:null, spriteScale:0};
  }

  function ensureSprites(){
    const scale = L.s * L.dpr;
    if (bouquet.sprites && bouquet.spriteScale === scale) return;
    bouquet.spriteScale = scale;
    bouquet.sprites = bouquet.flowers.map(f => flowerSprite(f.type, f.color, Math.max(8, Math.round(f.R*scale)), f.seed));
  }

  function leafShape(x, len, w, dark, euc, grow){
    if (grow <= 0) return;
    x.save(); x.scale(1, grow);
    if (euc){
      x.strokeStyle = '#5f7d63'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(0,0); x.quadraticCurveTo(8,-len*.5,0,-len); x.stroke();
      for (let k=1;k<8;k++){
        const t = k/8, py = -len*t, px = Math.sin(t*3)*4, rr = 13 - k*.8;
        const side = k%2 ? 1 : -1;
        const g = x.createRadialGradient(px+side*rr*.6, py-rr*.3, 0, px+side*rr*.6, py, rr*1.1);
        g.addColorStop(0,'#c3d8cc'); g.addColorStop(1,'#6f978a');
        x.fillStyle = g; x.beginPath(); x.ellipse(px+side*rr*.75, py, rr, rr*.82, 0, 0, TAU); x.fill();
      }
    } else {
      const p = new Path2D(`M0 0 C${w} ${-len*.25} ${w*.85} ${-len*.75} 0 ${-len} C${-w*.85} ${-len*.75} ${-w} ${-len*.25} 0 0Z`);
      const g = x.createLinearGradient(-w,0,w,0);
      g.addColorStop(0, dark ? '#1f6b34' : '#2f8a45'); g.addColorStop(.5, dark ? '#2f8a45' : '#4caf5e'); g.addColorStop(1, dark ? '#4f9e5c' : '#7fcf7e');
      x.fillStyle = g; x.fill(p);
      x.strokeStyle = 'rgba(220,255,210,.45)'; x.lineWidth = 1.4;
      x.beginPath(); x.moveTo(0,-2); x.quadraticCurveTo(2,-len*.5,0,-len*.96); x.stroke();
      x.strokeStyle = 'rgba(220,255,210,.2)'; x.lineWidth = 1;
      for (let k=1;k<6;k++){ const py = -len*k/6.5; x.beginPath(); x.moveTo(0,py); x.lineTo(w*.55,py-len*.07); x.moveTo(0,py); x.lineTo(-w*.55,py-len*.07); x.stroke(); }
    }
    x.restore();
  }

  const VASE = {top:352, bot:550, tl:132, tr:268, bl:142, br:258, water:410};
  function vasePath(){
    const v = VASE, p = new Path2D();
    p.moveTo(v.tl, v.top); p.lineTo(v.bl, v.bot-16);
    p.quadraticCurveTo(v.bl, v.bot, v.bl+16, v.bot); p.lineTo(v.br-16, v.bot);
    p.quadraticCurveTo(v.br, v.bot, v.br, v.bot-16); p.lineTo(v.tr, v.top); p.closePath();
    return p;
  }

  // draws the bouquet in bouquet units (0..400 x 0..560); bloom = seconds since start (Infinity = finished)
  function drawBouquet(x, bloom){
    const neck = {x:200, y:VASE.top+8};
    // shadow and caustic on the table
    let g = x.createRadialGradient(232,553,0,232,553,120);
    g.addColorStop(0,'rgba(70,25,15,.38)'); g.addColorStop(1,'rgba(70,25,15,0)');
    x.save(); x.translate(0,553); x.scale(1,.12);
    g = x.createRadialGradient(232,0,0,232,0,120); g.addColorStop(0,'rgba(70,25,15,.38)'); g.addColorStop(1,'rgba(70,25,15,0)');
    x.fillStyle = g; x.beginPath(); x.arc(232,0,120,0,TAU); x.fill();
    g = x.createRadialGradient(240,10,0,240,10,55); g.addColorStop(0,'rgba(255,245,210,.45)'); g.addColorStop(1,'rgba(255,245,210,0)');
    x.fillStyle = g; x.beginPath(); x.arc(240,10,55,0,TAU); x.fill();
    x.restore();

    // leaves behind
    bouquet.leaves.forEach(l => {
      const grow = clamp((bloom - l.delay)/.7, 0, 1);
      x.save(); x.translate(neck.x, neck.y); x.rotate(l.a + Math.PI/2);
      leafShape(x, l.len, l.w, l.dark, l.euc, ease(grow));
      x.restore();
    });
    // gypsophila
    const gGrow = clamp((bloom - 1.2)/.8, 0, 1);
    if (gGrow > 0){
      x.strokeStyle = 'rgba(110,150,100,.6)'; x.lineWidth = .8;
      bouquet.gyp.forEach(p => {
        x.globalAlpha = gGrow;
        x.beginPath(); x.moveTo(lerp(neck.x,p.x,.6), lerp(neck.y,p.y,.6)); x.lineTo(p.x,p.y); x.stroke();
        const gg = x.createRadialGradient(p.x-p.r*.3,p.y-p.r*.3,0,p.x,p.y,p.r);
        gg.addColorStop(0,'#ffffff'); gg.addColorStop(1,'#e6dde8');
        x.fillStyle = gg; x.beginPath(); x.arc(p.x,p.y,p.r,0,TAU); x.fill();
      });
      x.globalAlpha = 1;
    }
    // stems (all the way into the water)
    const stemPath = f => { const p = new Path2D(); const bx = 200 + (f.x-200)*.22; p.moveTo(f.x, f.y); p.quadraticCurveTo(lerp(f.x,neck.x,.6), lerp(f.y,neck.y,.5), neck.x + (f.x-200)*.12, neck.y); p.lineTo(bx, VASE.bot-12); return p; };
    x.lineCap = 'round';
    bouquet.flowers.forEach(f => { x.strokeStyle = '#3b7d3c'; x.lineWidth = 4; x.stroke(stemPath(f)); x.strokeStyle = 'rgba(160,220,140,.5)'; x.lineWidth = 1.3; x.stroke(stemPath(f)); });

    // glass + water
    const vp = vasePath();
    x.save(); x.clip(vp);
    // refracted stems in the water (slightly magnified)
    x.save(); x.beginPath(); x.rect(0, VASE.water, 400, 200); x.clip();
    x.fillStyle = 'rgba(190,225,210,.30)'; x.fillRect(0, VASE.water, 400, 200);
    x.translate(200, 0); x.scale(1.12, 1); x.translate(-200, 0);
    bouquet.flowers.forEach(f => { x.strokeStyle = 'rgba(40,110,55,.55)'; x.lineWidth = 4.5; x.stroke(stemPath(f)); });
    x.restore();
    g = x.createLinearGradient(VASE.tl,0,VASE.tr,0);
    g.addColorStop(0,'rgba(255,255,255,.30)'); g.addColorStop(.12,'rgba(255,255,255,.08)'); g.addColorStop(.6,'rgba(255,255,255,.04)'); g.addColorStop(.88,'rgba(170,200,210,.14)'); g.addColorStop(1,'rgba(255,255,255,.35)');
    x.fillStyle = g; x.fillRect(0,0,400,560);
    // highlight strips
    g = x.createLinearGradient(148,0,166,0);
    g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.5,'rgba(255,255,255,.7)'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(146, VASE.top+14, 22, VASE.bot-VASE.top-40);
    g = x.createLinearGradient(240,0,252,0);
    g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.5,'rgba(255,255,255,.35)'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(238, VASE.top+30, 16, VASE.bot-VASE.top-90);
    // thick glass bottom
    g = x.createLinearGradient(0,VASE.bot-22,0,VASE.bot);
    g.addColorStop(0,'rgba(200,230,230,.15)'); g.addColorStop(.5,'rgba(255,255,255,.45)'); g.addColorStop(1,'rgba(150,190,190,.35)');
    x.fillStyle = g; x.fillRect(0,VASE.bot-22,400,22);
    x.restore();
    // water surface
    const wl = VASE.tl + (VASE.bl-VASE.tl)*(VASE.water-VASE.top)/(VASE.bot-VASE.top), wr2 = 400 - wl;
    x.beginPath(); x.ellipse(200, VASE.water, (wr2-wl)/2, 6, 0, 0, TAU);
    x.fillStyle = 'rgba(220,245,235,.35)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 1.2; x.stroke();
    // outline and rim
    x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1.6; x.stroke(vp);
    x.strokeStyle = 'rgba(70,100,110,.28)'; x.lineWidth = 1; x.stroke(vp);
    x.beginPath(); x.ellipse(200, VASE.top, 68, 7, 0, 0, TAU);
    x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 2.2; x.stroke();
    x.strokeStyle = 'rgba(80,110,120,.3)'; x.lineWidth = 1; x.stroke();
    // satin ribbon around the stems
    x.save(); x.translate(200, VASE.top - 4);
    g = x.createLinearGradient(0,-8,0,8); g.addColorStop(0,'#ff8fb8'); g.addColorStop(.5,'#ff3f8e'); g.addColorStop(1,'#c21f63');
    x.fillStyle = g; x.beginPath(); x.ellipse(0,0,30,7,0,0,TAU); x.fill();
    x.restore();

    // flowers
    const sc = bouquet.spriteScale;
    bouquet.flowers.forEach((f,i) => {
      const k = clamp((bloom - f.delay)/.65, 0, 1);
      if (k <= 0) return;
      const sp = bouquet.sprites[i];
      const sz = sp.width / sc * backOut(k);
      x.save(); x.translate(f.x, f.y); x.rotate(f.rot - (1-k)*.6);
      x.globalAlpha = clamp(k*2, 0, 1);
      x.drawImage(sp, -sz/2, -sz/2, sz, sz);
      x.restore();
    });
    x.globalAlpha = 1;
  }

  function renderBouquetTo(ctx, bloom){
    ctx.save();
    ctx.translate(L.bx, L.by); ctx.scale(L.s, L.s);
    drawBouquet(ctx, bloom);
    ctx.restore();
  }

  /* ---------- walking cat (painted fur, seal-point like hers) ---------- */
  const CAT = {
    stride: 38, period: .9, duty: .62,
    legs: [
      {hind:true,  near:false, off:.5},
      {hind:false, near:false, off:.75},
      {hind:true,  near:true,  off:0},
      {hind:false, near:true,  off:.25}
    ]
  };
  const FUR_C = ['#ddc19d','rgba(236,216,188,.55)','rgba(246,232,210,.45)','rgba(204,172,134,.4)','rgba(226,203,172,.6)','rgba(252,244,228,.35)','rgba(192,158,120,.3)'];
  const FUR_S = ['#3e2619','rgba(86,54,37,.55)','rgba(42,24,15,.5)','rgba(104,68,47,.4)','rgba(68,41,27,.6)','rgba(122,84,60,.3)'];
  const FS = .2; // fur tile scale (cat units per tile pixel)

  function hair(x, X, Y, ang, len, w, col, bend=.18){
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const b = len*bend;
    const tx = X + dx*len + nx*b, ty = Y + dy*len + ny*b;
    const cx = X + dx*len*.5 + nx*b*.6, cy = Y + dy*len*.5 + ny*b*.6;
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(X + nx*w/2, Y + ny*w/2);
    x.quadraticCurveTo(cx + nx*w*.3, cy + ny*w*.3, tx, ty);
    x.quadraticCurveTo(cx - nx*w*.3, cy - ny*w*.3, X - nx*w/2, Y - ny*w/2);
    x.closePath(); x.fill();
  }
  function furTile(pal, seed){
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d');
    x.fillStyle = pal[0]; x.fillRect(0,0,S,S);
    const r = rng(seed);
    for (let i=0;i<5200;i++){
      const px = r()*S, py = r()*S, len = 9 + r()*14, ang = Math.PI + .12 + (r()-.3)*.3;
      const col = pal[1 + Math.floor(r()*(pal.length-1))], w = .9 + r()*1.3;
      for (const ox of [-S,0,S]) for (const oy of [-S,0,S]){
        const X = px+ox, Y = py+oy;
        if (X < -32 || X > S+4 || Y < -12 || Y > S+12) continue;
        hair(x, X, Y, ang, len, w, col, (r()-.5)*.4);
      }
    }
    return c;
  }
  let furTiles = null;
  const patCache = new WeakMap();
  function pats(x){
    if (!furTiles) furTiles = { c: furTile(FUR_C, 11), s: furTile(FUR_S, 23) };
    let p = patCache.get(x);
    if (!p){ p = { c: x.createPattern(furTiles.c,'repeat'), s: x.createPattern(furTiles.s,'repeat') }; patCache.set(x,p); }
    return p;
  }
  function orient(pat, ang, ox=0, oy=0){
    pat.setTransform(new DOMMatrix().translate(ox,oy).rotate((ang - Math.PI)*180/Math.PI).scale(FS));
    return pat;
  }

  const bez = (a,b,c,d,t) => { const m = 1-t; return m*m*m*a + 3*m*m*t*b + 3*m*t*t*c + t*t*t*d; };
  // sample a closed chain of cubic segments into points with outward normals (screen-clockwise chains)
  function sampleChain(start, segs, per){
    const pts = [];
    let p0 = start;
    segs.forEach((s, si) => {
      for (let i=0;i<per;i++){
        const t = i/per;
        const X = bez(p0[0], s[0], s[2], s[4], t), Y = bez(p0[1], s[1], s[3], s[5], t);
        const X2 = bez(p0[0], s[0], s[2], s[4], t+.01), Y2 = bez(p0[1], s[1], s[3], s[5], t+.01);
        let tx = X2-X, ty = Y2-Y; const l = Math.hypot(tx,ty) || 1; tx/=l; ty/=l;
        pts.push({x:X, y:Y, tx, ty, nx:ty, ny:-tx, seg:si});
      }
      p0 = [s[4], s[5]];
    });
    return pts;
  }
  function chainPath(pts){
    const p = new Path2D(); pts.forEach((q,i) => i ? p.lineTo(q.x,q.y) : p.moveTo(q.x,q.y)); p.closePath(); return p;
  }

  function bodySegs(b){
    return { start:[-86,-84+b], segs:[
      [-86,-100+b, -76,-107+b, -60,-107+b],
      [-40,-107+b, -24,-99+b, -4,-99+b],
      [14,-99+b, 28,-107+b, 40,-107+b],
      [56,-107+b, 72,-96+b, 72,-80+b],
      [72,-62+b, 62,-52+b, 50,-51+b],
      [34,-50+b, 16,-45+b, 0,-46+b],
      [-22,-47+b, -42,-45+b, -60,-51+b],
      [-78,-56+b, -89,-68+b, -86,-84+b]
    ]};
  }
  const HEAD = { start:[76,-128], segs:[
    [76,-140, 84,-147, 94,-147],
    [102,-147, 107,-143, 110,-138],
    [114,-132, 120,-124, 125,-118],
    [127,-115, 125,-112, 122,-112],
    [120,-111, 118,-109, 116,-108],
    [118,-105, 116,-101, 111,-101],
    [104,-100, 99,-102, 94,-104],
    [84,-108, 76,-118, 76,-128]
  ]};
  const headPts = sampleChain(HEAD.start, HEAD.segs, 10);
  const headPath = chainPath(headPts);

  function ik(ax, ay, bx, by, l1, l2, front){
    let dx = bx-ax, dy = by-ay, d = Math.hypot(dx,dy);
    d = Math.min(d, l1+l2-.01);
    const base = Math.atan2(dy,dx);
    const a = Math.acos(clamp((l1*l1 + d*d - l2*l2)/(2*l1*d), -1, 1));
    const j1 = [ax + Math.cos(base+a)*l1, ay + Math.sin(base+a)*l1];
    const j2 = [ax + Math.cos(base-a)*l1, ay + Math.sin(base-a)*l1];
    return front ? (j1[0] > j2[0] ? j1 : j2) : (j1[0] < j2[0] ? j1 : j2);
  }
  function limbPath(ax, ay, bx, by, wa, wb){
    const ang = Math.atan2(by-ay, bx-ax), nx = -Math.sin(ang), ny = Math.cos(ang);
    const p = new Path2D();
    p.moveTo(ax + nx*wa/2, ay + ny*wa/2); p.lineTo(bx + nx*wb/2, by + ny*wb/2);
    p.arc(bx, by, wb/2, ang + Math.PI/2, ang - Math.PI/2, true);
    p.lineTo(ax - nx*wa/2, ay - ny*wa/2);
    p.arc(ax, ay, wa/2, ang - Math.PI/2, ang + Math.PI/2, true);
    p.closePath();
    return {p, ang, nx, ny};
  }
  // a furry leg segment: seal fur, optional cream top fading down, fluffy side edges
  function furLimb(x, P, ax, ay, bx, by, wa, wb, opt={}){
    const L2 = limbPath(ax, ay, bx, by, wa, wb);
    const A0 = x.globalAlpha;
    const len0 = Math.hypot(bx-ax, by-ay), ux = (bx-ax)/len0, uy = (by-ay)/len0, wmax = Math.max(wa,wb);
    if (opt.cream){
      // seal fur only below the cream shoulder/thigh, so no dark rim shows on top
      x.save();
      const sx = ax + ux*len0*opt.cream*.1, sy = ay + uy*len0*opt.cream*.1;
      x.beginPath();
      x.moveTo(sx + L2.nx*wmax, sy + L2.ny*wmax); x.lineTo(bx + ux*wmax + L2.nx*wmax, by + uy*wmax + L2.ny*wmax);
      x.lineTo(bx + ux*wmax - L2.nx*wmax, by + uy*wmax - L2.ny*wmax); x.lineTo(sx - L2.nx*wmax, sy - L2.ny*wmax); x.closePath();
      x.clip();
      x.fillStyle = orient(P.s, L2.ang, ax, ay); x.fill(L2.p);
      x.restore();
    } else {
      x.fillStyle = orient(P.s, L2.ang, ax, ay); x.fill(L2.p);
    }
    if (opt.cream){
      x.save(); x.clip(L2.p);
      const bands = 14;
      for (let i=bands-1;i>=0;i--){
        const t1 = (i+1)/bands*opt.cream + .04;
        x.globalAlpha = A0 * (i === 0 ? 1 : Math.pow(1 - i/bands, .8));
        x.fillStyle = orient(P.c, L2.ang, ax, ay);
        const ex = ax + ux*len0*t1, ey = ay + uy*len0*t1;
        x.beginPath();
        x.moveTo(ax - ux*wmax + L2.nx*wmax, ay - uy*wmax + L2.ny*wmax);
        x.lineTo(ex + L2.nx*wmax, ey + L2.ny*wmax); x.lineTo(ex - L2.nx*wmax, ey - L2.ny*wmax);
        x.lineTo(ax - ux*wmax - L2.nx*wmax, ay - uy*wmax - L2.ny*wmax); x.closePath(); x.fill();
      }
      x.globalAlpha = A0;
      const g = x.createLinearGradient(ax,ay,bx,by);
      g.addColorStop(0,'rgba(120,80,50,0)'); g.addColorStop(1,'rgba(60,35,22,.35)');
      x.fillStyle = g; x.fill(L2.p);
      x.restore();
    }
    if (opt.shade){ x.fillStyle = `rgba(15,6,2,${opt.shade})`; x.fill(L2.p); }
    // side fluff
    const r = rng(opt.seed || 3);
    const len = Math.hypot(bx-ax, by-ay);
    const n = Math.ceil(len/2.2);
    for (let i=0;i<n;i++){
      const t = i/n, w = lerp(wa,wb,t)/2;
      for (const side of [1,-1]){
        const X = lerp(ax,bx,t) + L2.nx*w*side*.85, Y = lerp(ay,by,t) + L2.ny*w*side*.85;
        const a = Math.atan2(L2.ny*side*.6 + Math.sin(L2.ang), L2.nx*side*.6 + Math.cos(L2.ang));
        const creamy = opt.cream && t < opt.cream*.6;
        const pal = creamy ? FUR_C : FUR_S;
        hair(x, X, Y, a + (r()-.3)*.3, 1.2 + r()*2*(opt.fluff||1), 1 + r()*.8, pal[1 + Math.floor(r()*(pal.length-1))]);
      }
    }
  }

  function footFor(leg, phase, settle){
    const p = (phase + leg.off) % 1;
    let fx, fy, swing = 0;
    if (p < CAT.duty){ fx = CAT.stride/2 - CAT.stride*(p/CAT.duty); fy = 0; }
    else { const q = (p - CAT.duty)/(1 - CAT.duty); fx = -CAT.stride/2 + CAT.stride*ease(q); swing = Math.sin(Math.PI*q); fy = -(leg.hind ? 13 : 16)*swing; }
    return {fx: fx*(1-settle), fy: fy*(1-settle), swing: swing*(1-settle)};
  }

  function paw(x, P, px, py, near, seed){
    const g = x.createRadialGradient(px+2, py-2, 0, px+3, py, 9);
    g.addColorStop(0, near ? '#5a3829' : '#3a2318'); g.addColorStop(1, near ? '#2e1a12' : '#1e100a');
    x.fillStyle = g; x.beginPath(); x.ellipse(px+3, py+.5, 8.5, 4.8, 0, 0, TAU); x.fill();
    const r = rng(seed);
    for (let i=0;i<7;i++) hair(x, px-3 + i*2, py-3.5, -Math.PI/2 + (r()-.5)*.8 - .3, 2 + r()*2, .8, near ? 'rgba(110,72,50,.6)' : 'rgba(70,42,28,.6)');
  }

  function drawLeg(x, P, leg, phase, settle, bob){
    const f = footFor(leg, phase, settle);
    const near = leg.near;
    const shiftX = near ? 0 : 6, shiftY = near ? 0 : -3;
    const shade = near ? 0 : .28;
    const seed = (leg.hind ? 100 : 200) + (near ? 1 : 2);
    if (leg.hind){
      const H = [-50 + shiftX, -80 + bob + shiftY];
      const Pp = [-46 + shiftX + f.fx, -4 + f.fy + shiftY*.3];
      const K = [Pp[0] - 10 + f.swing*4, Pp[1] - 22 + f.swing*3];
      const S = ik(H[0],H[1],K[0],K[1],38,36,true);
      furLimb(x, P, H[0],H[1], S[0],S[1], 42, 21, {cream:.95, shade, seed, fluff:1.6});
      furLimb(x, P, S[0],S[1], K[0],K[1], 19, 12, {shade, seed:seed+5});
      furLimb(x, P, K[0],K[1], Pp[0],Pp[1], 12, 10, {shade, seed:seed+9});
      paw(x, P, Pp[0], Pp[1], near, seed+13);
    } else {
      const S0 = [44 + shiftX, -80 + bob*.6 + shiftY];
      const Pp = [50 + shiftX + f.fx, -4 + f.fy + shiftY*.3];
      const Wr = [Pp[0] + lerp(1, -5, f.swing), Pp[1] + lerp(-11, -8, f.swing)];
      const E = ik(S0[0],S0[1],Wr[0],Wr[1],34,33,false);
      furLimb(x, P, S0[0],S0[1], E[0],E[1], 30, 17, {cream:.9, shade, seed, fluff:1.3});
      furLimb(x, P, E[0],E[1], Wr[0],Wr[1], 16, 11, {shade, seed:seed+5});
      furLimb(x, P, Wr[0],Wr[1], Pp[0],Pp[1], 11, 10, {shade, seed:seed+9});
      paw(x, P, Pp[0], Pp[1], near, seed+13);
    }
  }

  function drawTail(x, P, time, bob){
    const sw = Math.sin(time*2.4)*9, sw2 = Math.sin(time*2.4 - 1)*7;
    const P0=[-82,-86+bob], C1=[-114,-92+bob], C2=[-136+sw*.4,-138+sw2], P3=[-118+sw,-176+sw2];
    const N = 44, pts = [];
    for (let i=0;i<=N;i++){
      const t = i/N;
      const X = bez(P0[0],C1[0],C2[0],P3[0],t), Y = bez(P0[1],C1[1],C2[1],P3[1],t);
      const X2 = bez(P0[0],C1[0],C2[0],P3[0],t+.01), Y2 = bez(P0[1],C1[1],C2[1],P3[1],t+.01);
      let tx = X2-X, ty = Y2-Y; const l = Math.hypot(tx,ty)||1;
      pts.push({x:X, y:Y, tx:tx/l, ty:ty/l, t});
    }
    // core
    x.lineCap = 'round';
    for (let i=1;i<pts.length;i++){
      const a = pts[i-1], b = pts[i];
      x.strokeStyle = orient(P.s, Math.atan2(b.y-a.y, b.x-a.x), a.x, a.y);
      x.lineWidth = lerp(17, 12, a.t); x.beginPath(); x.moveTo(a.x,a.y); x.lineTo(b.x,b.y); x.stroke();
    }
    // cream at the root
    const g = x.createRadialGradient(-82,-86+bob,0,-82,-86+bob,22);
    g.addColorStop(0,'rgba(214,186,150,.95)'); g.addColorStop(1,'rgba(214,186,150,0)');
    x.fillStyle = g; x.beginPath(); x.arc(-82,-86+bob,22,0,TAU); x.fill();
    // bushy hairs, flowing toward the tip
    const r = rng(77);
    pts.forEach(p => {
      const w = lerp(8, 6, p.t);
      for (let k=0;k<5;k++){
        const side = k%2 ? 1 : -1, nx = -p.ty*side, ny = p.tx*side;
        const X = p.x + nx*w*(.3 + r()*.6), Y = p.y + ny*w*(.3 + r()*.6);
        const a = Math.atan2(ny*.85 + p.ty*.9, nx*.85 + p.tx*.9) + (r()-.5)*.5;
        const pal = p.t < .12 ? FUR_C : FUR_S;
        hair(x, X, Y, a, 4 + r()*5*(1 - p.t*.3), 1.6 + r()*1.4, pal[1 + Math.floor(r()*(pal.length-1))], (r()-.5)*.5);
      }
    });
    // tip tuft
    const e = pts[pts.length-1];
    for (let k=0;k<12;k++) hair(x, e.x, e.y, Math.atan2(e.ty,e.tx) + (r()-.5)*1.2, 5 + r()*6, 1.2, FUR_S[1 + Math.floor(r()*(FUR_S.length-1))]);
  }

  function drawWalkingCat(x, time, settle){
    const P = pats(x);
    const phase = (time / CAT.period) % 1;
    const bob = Math.cos(phase*TAU*2) * 1.6 * (1-settle);
    const hb = Math.cos(phase*TAU*2 + .8) * 1.2 * (1-settle);
    // contact shadow
    let g = x.createRadialGradient(0,0,0,0,0,100);
    g.addColorStop(0,'rgba(60,20,10,.42)'); g.addColorStop(.6,'rgba(60,20,10,.15)'); g.addColorStop(1,'rgba(60,20,10,0)');
    x.save(); x.scale(1,.09); x.fillStyle = g; x.beginPath(); x.arc(14,0,100,0,TAU); x.fill(); x.restore();

    drawLeg(x, P, CAT.legs[0], phase, settle, bob);
    drawLeg(x, P, CAT.legs[1], phase, settle, bob);
    drawTail(x, P, time, bob);

    // body: real fur texture + soft form shading
    const B = bodySegs(bob);
    const bpts = sampleChain(B.start, B.segs, 16);
    const bp = chainPath(bpts);
    x.fillStyle = orient(P.c, Math.PI + .1); x.fill(bp);
    x.save(); x.clip(bp);
    g = x.createLinearGradient(0,-107+bob,0,-45+bob);
    g.addColorStop(0,'rgba(150,110,72,.30)'); g.addColorStop(.25,'rgba(150,110,72,0)'); g.addColorStop(.6,'rgba(255,248,235,.18)'); g.addColorStop(.85,'rgba(120,80,50,.12)'); g.addColorStop(1,'rgba(90,55,30,.42)');
    x.fillStyle = g; x.fillRect(-100,-110,190,70);
    g = x.createRadialGradient(-84,-82+bob,0,-84,-82+bob,62);
    g.addColorStop(0,'rgba(85,52,32,.45)'); g.addColorStop(1,'rgba(85,52,32,0)');
    x.fillStyle = g; x.fillRect(-100,-120,120,90);
    g = x.createRadialGradient(-10,-110+bob,0,-10,-110+bob,60);
    g.addColorStop(0,'rgba(255,246,228,.28)'); g.addColorStop(1,'rgba(255,246,228,0)');
    x.fillStyle = g; x.fillRect(-80,-120,140,60);
    x.restore();
    // fluffy outline: fur flows back and down, longer on the belly
    let r = rng(31);
    bpts.forEach(p => {
      const belly = p.ny > .4, back = p.ny < -.5;
      for (let k=0;k<2;k++){
        const vx = p.nx - .75, vy = p.ny + (belly ? .5 : .12);
        const a = Math.atan2(vy, vx) + (r()-.5)*.5;
        const len = belly ? 3 + r()*4 : back ? 1.5 + r()*1.8 : 2 + r()*3;
        const col = belly ? FUR_C[1 + Math.floor(r()*3)] : FUR_C[1 + Math.floor(r()*(FUR_C.length-1))];
        hair(x, p.x - p.nx*1.2 + (r()-.5)*2, p.y - p.ny*1.2, a, len, 1.4 + r()*1.2, col, (r()-.5)*.3);
      }
    });
    // soft rim light along the back
    x.save(); x.strokeStyle = 'rgba(255,246,226,.35)'; x.lineWidth = 1.4;
    x.beginPath(); bpts.filter(p => p.seg < 3).forEach((p,i) => i ? x.lineTo(p.x, p.y+1) : x.moveTo(p.x, p.y+1)); x.stroke(); x.restore();

    // near legs
    drawLeg(x, P, CAT.legs[2], phase, settle, bob);
    drawLeg(x, P, CAT.legs[3], phase, settle, bob);

    // neck and fluffy chest ruff
    const hy = hb + bob*.5;
    const neck = new Path2D(`M26 ${-104+bob} C38 ${-118+bob} 52 ${-134+hy} 70 ${-142+hy} L102 ${-100+hy} C90 ${-92+hy} 80 ${-82+bob} 72 ${-70+bob} C60 ${-80+bob} 40 ${-96+bob} 26 ${-104+bob}Z`);
    x.fillStyle = orient(P.c, Math.PI*.82, 60, -110); x.fill(neck);
    g = x.createLinearGradient(40,-140,70,-80);
    g.addColorStop(0,'rgba(150,110,75,.32)'); g.addColorStop(.5,'rgba(150,110,75,0)'); g.addColorStop(1,'rgba(255,250,238,.2)');
    x.fillStyle = g; x.fill(neck);
    r = rng(51);
    for (let i=0;i<46;i++){
      const t = i/46;
      const X = lerp(100, 66, t) + (r()-.5)*3, Y = lerp(-100+hy, -66+bob, t);
      const a = Math.atan2(1, .35 - t*.5) + (r()-.5)*.6;
      hair(x, X - 3, Y, a, 4 + r()*5, 1.8 + r()*1.4, FUR_C[1 + Math.floor(r()*(FUR_C.length-1))], (r()-.5)*.5);
    }

    // head (scaled up a touch, as her cat has a round fluffy head)
    x.save(); x.translate(82, -116 + hy); x.scale(1.32, 1.32); x.translate(-96, 124);
    // far ear
    x.fillStyle = '#24140e';
    x.beginPath(); x.moveTo(74,-136); x.quadraticCurveTo(70,-156,74,-166); x.quadraticCurveTo(84,-152,90,-142); x.closePath(); x.fill();
    // skull: seal mask fur, cream back of the head
    x.fillStyle = orient(P.s, Math.PI + .2, 110, -120); x.fill(headPath);
    x.save(); x.clip(headPath);
    g = x.createRadialGradient(78,-132,0,80,-128,30);
    g.addColorStop(0,'rgba(222,196,160,.95)'); g.addColorStop(.45,'rgba(200,168,130,.7)'); g.addColorStop(1,'rgba(160,120,85,0)');
    x.fillStyle = g; x.fillRect(60,-160,70,70);
    g = x.createRadialGradient(88,-104,0,88,-104,14);
    g.addColorStop(0,'rgba(214,186,150,.85)'); g.addColorStop(1,'rgba(214,186,150,0)');
    x.fillStyle = g; x.fillRect(70,-120,40,30);
    g = x.createRadialGradient(104,-140,0,104,-136,18);
    g.addColorStop(0,'rgba(255,230,200,.16)'); g.addColorStop(1,'rgba(255,230,200,0)');
    x.fillStyle = g; x.fillRect(84,-156,40,40);
    x.restore();
    // cheek ruff and back-of-head fluff
    r = rng(61);
    headPts.forEach(p => {
      if (p.seg < 6) return;
      for (let k=0;k<2;k++){
        const back = p.seg === 7;
        const a = Math.atan2(p.ny + .4, p.nx - .5) + (r()-.5)*.5;
        const pal = back ? FUR_C : (r() > .5 ? FUR_S : FUR_C);
        hair(x, p.x - p.nx, p.y - p.ny, a, 2 + r()*2.5, 1.2 + r()*.8, pal[1 + Math.floor(r()*(pal.length-1))]);
      }
    });
    // near ear with light inner hairs
    x.fillStyle = '#2c1912';
    x.beginPath(); x.moveTo(82,-142); x.quadraticCurveTo(81,-162,88,-173); x.quadraticCurveTo(99,-158,103,-144); x.closePath(); x.fill();
    x.fillStyle = 'rgba(120,72,60,.6)';
    x.beginPath(); x.moveTo(87,-146); x.quadraticCurveTo(87,-158,89.5,-165); x.quadraticCurveTo(96,-155,98,-147); x.closePath(); x.fill();
    for (let i=0;i<9;i++) hair(x, 88 + i*1.1, -146, -Math.PI/2 - .35 + i*.05 + (r()-.5)*.3, 6 + r()*5, .6, 'rgba(235,215,200,.55)');
    // eye
    x.save(); x.translate(106,-127.5); x.rotate(-.32);
    x.fillStyle = '#140a06'; x.beginPath(); x.ellipse(0,0,7.2,4.4,0,0,TAU); x.fill();
    g = x.createRadialGradient(1.5,.5,0,.6,0,6.4);
    g.addColorStop(0,'#d8f2ff'); g.addColorStop(.35,'#86cdf5'); g.addColorStop(.75,'#3f93d6'); g.addColorStop(1,'#1f5c9a');
    x.fillStyle = g; x.beginPath(); x.ellipse(.6,.2,6,3.5,0,0,TAU); x.fill();
    x.strokeStyle = 'rgba(30,80,140,.35)'; x.lineWidth = .3;
    for (let i=0;i<14;i++){ const a = i/14*TAU; x.beginPath(); x.moveTo(1.4+Math.cos(a)*1.6, Math.sin(a)*1.4); x.lineTo(1.4+Math.cos(a)*5, Math.sin(a)*3); x.stroke(); }
    x.fillStyle = '#080403'; x.beginPath(); x.ellipse(1.4,.1,1.1,3,0,0,TAU); x.fill();
    x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(.6,-2.2,6,1.6,0,0,TAU); x.fill();
    x.fillStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.arc(3,-1.3,1.05,0,TAU); x.fill();
    x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.arc(-1.8,1.4,.55,0,TAU); x.fill();
    x.restore();
    // nose leather
    x.fillStyle = '#1b0e09'; x.beginPath(); x.ellipse(122.4,-114.6,2.8,2.1,.45,0,TAU); x.fill();
    x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.arc(122.8,-115.8,.7,0,TAU); x.fill();

    // envelope in the mouth
    x.save(); x.translate(116,-104); x.rotate(.12);
    x.fillStyle = 'rgba(60,10,25,.25)'; x.fillRect(-5,-4,34,23);
    g = x.createLinearGradient(-4,-8,30,14); g.addColorStop(0,'#ffd8e4'); g.addColorStop(1,'#f0a2bd');
    x.fillStyle = g; x.fillRect(-6,-6,34,23);
    x.strokeStyle = '#e595b0'; x.lineWidth = .8; x.strokeRect(-6,-6,34,23);
    x.fillStyle = '#ffe3ec'; x.beginPath(); x.moveTo(-6,-6); x.lineTo(11,6); x.lineTo(28,-6); x.closePath(); x.fill(); x.stroke();
    g = x.createRadialGradient(10,5,0,11,6,3.4); g.addColorStop(0,'#ff6f9f'); g.addColorStop(1,'#a3103f');
    x.fillStyle = g; x.beginPath(); x.arc(11,6,3.2,0,TAU); x.fill();
    x.restore();
    // lips over the envelope
    x.fillStyle = '#26150f'; x.beginPath(); x.ellipse(113,-104.5,5.2,3.2,.2,0,TAU); x.fill();
    // whiskers and brow whiskers
    x.lineCap = 'round';
    for (let i=0;i<5;i++){ x.strokeStyle = `rgba(255,255,255,${.9 - i*.1})`; x.lineWidth = .65; x.beginPath(); x.moveTo(116,-110 + i*1.3); x.quadraticCurveTo(134,-117 + i*5, 154,-118 + i*8.5); x.stroke(); }
    x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = .45;
    for (let i=0;i<2;i++){ x.beginPath(); x.moveTo(108,-134 - i); x.quadraticCurveTo(118,-146 - i*3, 128,-150 - i*4); x.stroke(); }
    x.restore();
  }

  /* ---------- timeline ---------- */
  const T = { walkStart: 1.7, walkDur: 2.75, settle: .35, fade: .75 };
  const CAT_X0 = .26, CAT_X1 = .68;
  function frame(now){
    const t = (now - t0)/1000;
    const {dpr, W, H, u, left, ground} = L;
    rctx.setTransform(dpr,0,0,dpr,0,0);
    rctx.clearRect(0,0,W,H);
    rctx.drawImage(bgCache, 0, 0, W, H);

    const k = u*.6/210;
    const tw = t - T.walkStart;
    const tFadeStart = T.walkDur + T.settle;
    const photoA = clamp((tw - tFadeStart)/T.fade, 0, 1);
    const walkA = tw <= 0 ? 0 : clamp(tw/.5, 0, 1) * (1 - photoA);

    // her real cat, sitting (appears as the walking cat sits down)
    if (photoA > 0){
      const c = L.cat;
      const sc = lerp(.96, 1, ease(photoA));
      const cw = c.w*sc, ch = c.h*sc;
      rctx.save(); rctx.globalAlpha = ease(photoA);
      const gx = c.x + c.w*.52, gg = rctx.createRadialGradient(gx, ground, 0, gx, ground, c.w*.55);
      gg.addColorStop(0,'rgba(60,20,10,.35)'); gg.addColorStop(1,'rgba(60,20,10,0)');
      rctx.save(); rctx.translate(0, ground); rctx.scale(1,.12); rctx.translate(0,-ground);
      rctx.fillStyle = gg; rctx.beginPath(); rctx.arc(gx, ground, c.w*.55, 0, TAU); rctx.fill(); rctx.restore();
      rctx.drawImage(catImg, c.x + (c.w-cw)/2, ground - ch, cw, ch);
      rctx.restore();
    }
    if (walkA > 0){
      const walkT = clamp(tw, 0, T.walkDur);
      const settle = clamp((tw - T.walkDur)/T.settle, 0, 1);
      const prog = walkT / T.walkDur;
      const cx = left + u*lerp(CAT_X0, CAT_X1, prog);
      rctx.save(); rctx.globalAlpha = walkA;
      rctx.translate(cx, ground); rctx.scale(k, k);
      drawWalkingCat(rctx, walkT, ease(settle));
      rctx.restore();
    }

    // bouquet on top (cat walks out from behind it)
    if (t < 3.2 || !bouquetCache){
      renderBouquetTo(rctx, t);
      if (t >= 3.2) cacheBouquet();
    } else {
      rctx.drawImage(bouquetCache, 0, 0, W, H);
    }

    if (tw > tFadeStart + T.fade){ running = false; onArrived(); return; }
    requestAnimationFrame(frame);
  }
  function cacheBouquet(){
    const c = document.createElement('canvas'); c.width = room.width; c.height = room.height;
    const x = c.getContext('2d'); x.scale(L.dpr, L.dpr);
    renderBouquetTo(x, Infinity);
    bouquetCache = c;
  }
  function drawStatic(){
    const {dpr, W, H, ground} = L;
    rctx.setTransform(dpr,0,0,dpr,0,0);
    rctx.clearRect(0,0,W,H);
    rctx.drawImage(bgCache, 0, 0, W, H);
    const c = L.cat;
    const gx = c.x + c.w*.52, gg = rctx.createRadialGradient(gx, ground, 0, gx, ground, c.w*.55);
    gg.addColorStop(0,'rgba(60,20,10,.35)'); gg.addColorStop(1,'rgba(60,20,10,0)');
    rctx.save(); rctx.translate(0, ground); rctx.scale(1,.12); rctx.translate(0,-ground);
    rctx.fillStyle = gg; rctx.beginPath(); rctx.arc(gx, ground, c.w*.55, 0, TAU); rctx.fill(); rctx.restore();
    rctx.drawImage(catImg, c.x, ground - c.h, c.w, c.h);
    if (!bouquetCache) cacheBouquet();
    rctx.drawImage(bouquetCache, 0, 0, W, H);
  }
  let arrived = false;
  function onArrived(){
    arrived = true;
    drawStatic();
    $('miniEnv').classList.add('ready');
    $('hint').classList.add('on');
  }

  function showGift(){
    $('ask').hidden = true; $('nope').hidden = true;
    const gift = $('gift');
    gift.hidden = false; void gift.offsetWidth; gift.classList.add('go-title');
    if (!bouquet) bouquet = planBouquet();
    const start = () => {
      layout(); ensureSprites();
      if (reduce){ onArrived(); return; }
      t0 = performance.now(); running = true;
      requestAnimationFrame(frame);
    };
    catImg.complete ? start() : catImg.addEventListener('load', start, {once:true});
  }

  let rz;
  addEventListener('resize', () => {
    if ($('gift').hidden) return;
    clearTimeout(rz);
    rz = setTimeout(() => { layout(); ensureSprites(); if (!running) drawStatic(); }, 120);
  });

  /* =========================================================
     Envelope and letter
     ========================================================= */
  $('miniEnv').addEventListener('click', openLetter);
  async function openLetter(){
    const mini = $('miniEnv');
    const r = mini.getBoundingClientRect();
    mini.classList.remove('ready'); mini.style.opacity = 0;
    $('hint').classList.remove('on');
    const ov = $('overlay'), env = $('env');
    env.className = 'env';
    ov.hidden = false;
    const er = env.getBoundingClientRect();
    const sx = r.width/er.width, dx = (r.left + r.width/2) - (er.left + er.width/2), dy = (r.top + r.height/2) - (er.top + er.height/2);
    env.style.transition = 'none';
    env.style.transform = `translate(${dx}px,${dy}px) scale(${sx}) rotate(-9deg)`;
    void env.offsetWidth;
    env.style.transition = '';
    env.style.transform = '';
    ov.classList.add('dim');
    await wait(950);
    env.classList.add('open');
    await wait(380);
    env.classList.add('flapback');
    await wait(420);
    env.classList.add('out');
    await wait(1000);
    env.classList.add('gone');
    const letter = $('letter');
    letter.hidden = false; void letter.offsetWidth; letter.classList.add('show');
    $('letterText').scrollTop = 0;
    await wait(450);
    ov.hidden = true;
    $('closeLetter').focus({preventScroll:true});
  }
  $('page').addEventListener('click', () => {
    const l = $('letter'); l.classList.toggle('zoomed');
    $('zoomHint').textContent = l.classList.contains('zoomed') ? 'нажми ещё раз, чтобы уменьшить' : 'нажми на письмо, чтобы увеличить';
  });
  $('closeLetter').addEventListener('click', async () => {
    $('letter').classList.remove('zoomed');
    const letter = $('letter');
    letter.classList.remove('show');
    $('overlay').classList.remove('dim');
    await wait(500);
    letter.hidden = true;
    $('env').className = 'env';
    const mini = $('miniEnv'); mini.style.opacity = ''; mini.classList.add('ready');
  });
})();
