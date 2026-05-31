/* =============================================
   modules/calculator.js — Math parsing and
   HTML5 Canvas graphing
   ============================================= */

(function() {
    'use strict';

    // ========== Expression Preprocessing ==========
    function preprocessExpression(expr) {
        var e = expr.trim();

        // Replace ^ with ** for exponentiation
        e = e.replace(/\^/g, '**');

        // Fix implicit multiplication:
        // number followed by x: 2x → 2*x
        e = e.replace(/(\d)([x])/gi, '$1*$2');
        // x followed by number: x2 → x*2
        e = e.replace(/([x])(\d)/gi, '$1*$2');
        // number followed by (: 2( → 2*(
        e = e.replace(/(\d)\(/g, '$1*(');
        // ) followed by number: )2 → )*2
        e = e.replace(/\)(\d)/g, ')*$1');
        // ) followed by (: )( → )*(
        e = e.replace(/\)\(/g, ')*(');
        // x followed by (: x( → x*(
        e = e.replace(/([x])\(/gi, '$1*(');
        // ) followed by x: )x → )*x
        e = e.replace(/\)([x])/gi, ')*$1');

        return e;
    }

    // ========== Safe Evaluation ==========
    function safeEval(expr) {
        var processed = preprocessExpression(expr);
        try {
            var result = Function('"use strict"; return (' + processed + ')')();
            if (typeof result === 'number' && isFinite(result)) {
                return result;
            }
            return null;
        } catch (err) {
            return null;
        }
    }

    // ========== Check if expression contains variable x ==========
    function hasVariable(expr) {
        return /x/i.test(expr);
    }

    // ========== Graph Rendering ==========
    function renderGraph(expr) {
        var canvas = document.getElementById('graphCanvas');
        if (!canvas) return;

        // CRITICAL: Set canvas width and height attributes for sharpness
        canvas.width = 720;
        canvas.height = 360;

        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        var centerX = w / 2;
        var centerY = h / 2;
        var scale = 32; // pixels per unit

        // Clear
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, w, h);

        // Draw grid
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 0.5;
        for (var gx = centerX % scale; gx < w; gx += scale) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, h);
            ctx.stroke();
        }
        for (var gy = centerY % scale; gy < h; gy += scale) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(w, gy);
            ctx.stroke();
        }

        // Draw axes
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        // X axis
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.stroke();
        // Y axis
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, h);
        ctx.stroke();

        // Axis labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'center';
        for (var lx = -10; lx <= 10; lx++) {
            if (lx === 0) continue;
            var px = centerX + lx * scale;
            if (px > 10 && px < w - 10) {
                ctx.fillText(String(lx), px, centerY + 16);
            }
        }
        ctx.textAlign = 'right';
        for (var ly = -5; ly <= 5; ly++) {
            if (ly === 0) continue;
            var py = centerY - ly * scale;
            if (py > 10 && py < h - 10) {
                ctx.fillText(String(ly), centerX - 8, py + 4);
            }
        }

        // Plot the function
        var processed = preprocessExpression(expr);
        ctx.strokeStyle = '#2596be';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();

        var started = false;
        var step = 0.05;
        for (var xVal = -11; xVal <= 11; xVal += step) {
            try {
                var xExpr = processed.replace(/x/gi, '(' + xVal + ')');
                var yVal = Function('"use strict"; return (' + xExpr + ')')();

                if (typeof yVal !== 'number' || !isFinite(yVal)) {
                    started = false;
                    continue;
                }

                var cx = centerX + xVal * scale;
                var cy = centerY - yVal * scale;

                // Skip if way off screen
                if (cy < -500 || cy > h + 500) {
                    started = false;
                    continue;
                }

                if (!started) {
                    ctx.moveTo(cx, cy);
                    started = true;
                } else {
                    ctx.lineTo(cx, cy);
                }
            } catch (err) {
                started = false;
            }
        }
        ctx.stroke();

        // Draw glow effect on the line
        ctx.strokeStyle = 'rgba(37, 150, 190, 0.2)';
        ctx.lineWidth = 8;
        ctx.stroke();
    }

    // ========== Main Handle Function ==========
    function handle(expr) {
        var dom = window.Nova ? window.Nova.dom : null;
        if (!dom) return;

        // Show search screen with calculator
        if (window.Nova && window.Nova.showScreen) {
            Nova.showScreen('search-calc');
        } else {
            document.getElementById('searchScreen').classList.remove('hidden');
            document.getElementById('calculatorWidget').classList.remove('hidden');
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('mapWidget').classList.add('hidden');
        }

        dom.calcInput.value = expr;

        if (hasVariable(expr)) {
            // Graph mode
            dom.calcResult.textContent = 'f(x) = ' + expr;
            renderGraph(expr);
        } else {
            // Evaluate mode
            var result = safeEval(expr);
            dom.calcResult.textContent = (result !== null) ? '= ' + result : 'Invalid expression';
            // Hide canvas if no graph
            dom.graphCanvas.style.display = 'none';
            // Re-show on next graph
            setTimeout(function() {
                dom.graphCanvas.style.display = 'block';
            }, 50);
        }
    }

    // ========== Expose to Nova namespace ==========
    window.Nova = window.Nova || {};
    window.Nova.Calculator = {
        handle: handle,
        safeEval: safeEval,
        renderGraph: renderGraph
    };
})();
