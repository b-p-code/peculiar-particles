/***** TITLE *****/
// Peculiar Particles
/*****************/

/***** AUTHOR *****/
// Bryce Paubel
/******************/

/***** DESCRIPTION *****/
// A fun look into simple 2D particle systems
// These are all processed serially
/***********************/

/***** COPYRIGHT *****/
// Copyright 2022 Bryce Paubel
/*********************/

/***** LICENSING *****/
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License along
// with this program; if not, write to the Free Software Foundation, Inc.,
// 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
/*********************/

const V_SHADER_SOURCE = `#version 300 es
	in vec2 a_p;		// Position
	in float a_p_s;		// Point size
	
	void main() {
		gl_PointSize = a_p_s;
		gl_Position = vec4(a_p, 0.0, 1.0);
	}
`

const F_SHADER_SOURCE = `#version 300 es
	precision highp float;
	out vec4 out_c; // Output color
	
	uniform vec4 u_c;	// Input color
	
	void main() {
		out_c = u_c;
	}
`

// Configuration object
let config = {
	MOUSE: null,
	SELECTION: 1,
	PARTICLES: 10,
}

// Main program
function main() {
	// Animation ID
	let animID = 1;
	
	// Particle array
	let particles = [];
	
	// Initialize canvas
	let canvas = document.getElementById("canvas");
	canvas.margin = 0;
	canvas.width = 1.0 * window.innerWidth;
	canvas.height = 1.01 * window.innerHeight;
	
	// Get rendering context and initialize shaders
	let webGL = canvas.getContext("webgl2");
	initShaders(webGL, V_SHADER_SOURCE, F_SHADER_SOURCE);
	
	setCanvasEvents(canvas);
	
	for (let i = 0; i < config.PARTICLES; i++) {		
		particles.push(new Particle(
			Math.log(i + 100000), 
			[0.0, 0.0], 
			[0.0, 0.0], 
			[(i + 1) / (config.PARTICLES + 1) * 0.8 + 0.2, 0.0, 0.0, 1.0], 
			(i + 1) / (3 * config.PARTICLES)));
		console.log(particles[i]);
	}
	
	let update = function() {
		cancelAnimationFrame(animID);		
		webGL.clearColor(0.0, 0.0, 0.0, 1.0);
		webGL.clear(webGL.COLOR_BUFFER_BIT);
		drawParticles(webGL, particles);
		animID = requestAnimationFrame(update);
	}
	
	update();
}

// Draw a particle array
function drawParticles(webGL, particleArray) {
	for (let i = 0; i < particleArray.length; i++) {
		updateParticle(config.SELECTION, particleArray[i]);
		drawParticle(webGL, particleArray[i]);
	}
}

// Update a particle
function updateParticle(selection, particle) {
	switch (selection) {
		case 0: 
			followCursor(canvas, particle);
			break;
		case 1:
			followCursorCircle(canvas, particle);
			break;
	}
}

// Set the canvas events to update the mouse position
function setCanvasEvents(canvas) {
	canvas.onmousemove = function(e) {
		config.MOUSE = [e.clientX, e.clientY];
	}
	
	canvas.onmouseout = function() {
		config.MOUSE = null;
	}
	
}

// Draw a singular particle
function drawParticle(gl, particle) {
	// Vertex shader pointers
	let a_p = gl.getAttribLocation(gl.program, "a_p");
	let a_p_s = gl.getAttribLocation(gl.program, "a_p_s");
	
	// Fragment shader pointers
	let u_c = gl.getUniformLocation(gl.program, "u_c");
	
	gl.vertexAttrib2f(a_p, particle.position[0], particle.position[1]);
	gl.vertexAttrib1f(a_p_s, particle.size);
	gl.uniform4f(u_c, particle.color[0], particle.color[1], particle.color[2], particle.color[3]);
	gl.drawArrays(gl.POINTS, 0, 1);
}

// Update particle to follow the cursor
function followCursor(canvas, particle) {
	if (config.MOUSE) {
		particle.velocity = [(2 * config.MOUSE[0] / canvas.width) - 1 - particle.position[0], (2 * config.MOUSE[1] / (-canvas.height)) + 1 - particle.position[1]];
		particle.velocity = [particle.velocity[0] * particle.scale, particle.velocity[1] * particle.scale];
		particle.position = [particle.position[0] + particle.velocity[0], particle.position[1] + particle.velocity[1]];
	}
}

// Update particle to drop from the cursor
function followCursorCircle(canvas, particle) {
	if (config.MOUSE) {
		let centerVelo = [(2 * config.MOUSE[0] / canvas.width) - 1 - particle.position[0], (2 * config.MOUSE[1] / (-canvas.height)) + 1 - particle.position[1]];
		let perpendicularVelo = [-centerVelo[1], centerVelo[0]];
		particle.velocity = [particle.velocity[0], particle.velocity[1]];
		particle.position = [particle.position[0] + centerVelo[0] * particle.scale
			+ perpendicularVelo[0] * particle.scale, 
			particle.position[1] + centerVelo[1] * particle.scale 
			+ perpendicularVelo[1] * particle.scale + particle.velocity[1]];
	}
}

// Particle constructor
function Particle(size, position, velocity, color, scale) {
	this.size = size;
	this.position = position;
	this.velocity = velocity;
	this.color = color;
	this.scale = scale;
}
