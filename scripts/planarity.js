"use strict";

let canvas = document.getElementById("planar-canvas");
let ctx = canvas ? canvas.getContext("2d") : null;
let interCountElem = document.getElementById("intersections");

let nodes = [];
let edges = [];
let draggingNode = null;

function checkIntersection(p1, p2, p3, p4) {
    function ccw(A, B, C) {
        return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    }
    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

function countIntersections() {
    let count = 0;
    for (let i = 0; i < edges.length; i++) {
        for (let j = i + 1; j < edges.length; j++) {
            const e1 = edges[i];
            const e2 = edges[j];
            if (e1[0] === e2[0] || e1[0] === e2[1] || e1[1] === e2[0] || e1[1] === e2[1]) continue;

            if (checkIntersection(nodes[e1[0]], nodes[e1[1]], nodes[e2[0]], nodes[e2[1]])) {
                count++;
            }
        }
    }
    return count;
}

function draw() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const intersections = countIntersections();

    // Ребра
    edges.forEach(([start, end]) => {
        ctx.strokeStyle = intersections === 0 ? "#98c379" : "#8f5363";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(nodes[start].x, nodes[start].y);
        ctx.lineTo(nodes[end].x, nodes[end].y);
        ctx.stroke();
    });

    // Вузли
    nodes.forEach(node => {
        ctx.fillStyle = "#c76d80";
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });

    if (interCountElem) {
        interCountElem.textContent = intersections;
        if (intersections === 0) {
            interCountElem.classList.add("solved");
            interCountElem.textContent = "0 (SOLVED!)";
        } else {
            interCountElem.classList.remove("solved");
        }
    }
}

window.initLevel = function() {
    canvas = document.getElementById("planar-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    interCountElem = document.getElementById("intersections");

    const numNodes = 6;
    const padding = 50;
    const minDistance = 70;

    edges = [
        [0, 2], [2, 4], [4, 1], [1, 3], [3, 5], [5, 0],
        [0, 3], [1, 4]
    ];

    let attempts = 0;
    let validLayout = false;

    while (!validLayout && attempts < 100) {
        attempts++;
        nodes = [];

        for (let i = 0; i < numNodes; i++) {
            let placed = false;
            let subAttempts = 0;

            while (!placed && subAttempts < 50) {
                subAttempts++;
                const candidateX = padding + Math.random() * (canvas.width - padding * 2);
                const candidateY = padding + Math.random() * (canvas.height - padding * 2);

                const tooClose = nodes.some(n => Math.hypot(n.x - candidateX, n.y - candidateY) < minDistance);
                if (!tooClose) {
                    nodes.push({
                        id: i,
                        x: candidateX,
                        y: candidateY,
                        radius: 10
                    });
                    placed = true;
                }
            }

            if (!placed) {
                nodes.push({
                    id: i,
                    x: padding + Math.random() * (canvas.width - padding * 2),
                    y: padding + Math.random() * (canvas.height - padding * 2),
                    radius: 10
                });
            }
        }

        if (countIntersections() >= 2) {
            validLayout = true;
        }
    }

    draw();
};

document.addEventListener("DOMContentLoaded", () => {
    window.initLevel();

    if (canvas) {
        canvas.addEventListener("mousedown", (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            draggingNode = nodes.find(node => Math.hypot(node.x - x, node.y - y) <= node.radius * 1.5);
        });

        window.addEventListener("mousemove", (e) => {
            if (!draggingNode || !canvas) return;
            const rect = canvas.getBoundingClientRect();
            draggingNode.x = Math.max(15, Math.min(canvas.width - 15, e.clientX - rect.left));
            draggingNode.y = Math.max(15, Math.min(canvas.height - 15, e.clientY - rect.top));
            draw();
        });

        window.addEventListener("mouseup", () => {
            draggingNode = null;
        });
    }
});