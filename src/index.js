'use strict';

var LightningVisualization = require('lightning-visualization');
var _ = require('lodash');
var THREE = require('three.js');
require('three-fly-controls')(THREE);
var utils = require('lightning-client-utils');
var d3 = require('d3-color');

/*
 * Extend the base visualization object
 */
var Scatter3 = LightningVisualization.extend({

    init: function() {
        /*
         * FILL IN Add any logic for initializing the visualization
         */
        this.defaultColor = d3.rgb('#A38EF3')
        this.defaultSize = 6;
        this.scene = new THREE.Scene();
        this.geometry = new THREE.Geometry();

        this.render();
    },

    /*
     * optionally pass a string of CSS styles 
     */
    // styles: styles,

    renderGrid: function() {

        var scene = this.scene;
        var max = this.max;
        var gridSize = 50 * max;
        var gridStep = max / 4;

        var lightLineMaterial = new THREE.LineBasicMaterial({
            color: 0xcccccc
        });
        var darkLineMaterial = new THREE.LineBasicMaterial({
            color: 0x444444
        });
        var lineGeometry, line; 
        var drawGrid = function(startMask, endMask) {
            var getStartVal = function(idx, i) {
                if(startMask[idx] === 1) {
                    return i;
                }
                return 0;
            };
            var getEndVal = function(idx, i) {
                if(endMask[idx] === 1) {
                    return i;
                } else if(endMask[idx] === 2) {
                    return gridSize;
                }
                return 0;
            };
            for(var i=0; i<gridSize; i+=gridStep) {
                lineGeometry = new THREE.Geometry();
                lineGeometry.vertices.push(new THREE.Vector3(getStartVal(0, i), getStartVal(1, i), getStartVal(2, i)));
                lineGeometry.vertices.push(new THREE.Vector3(getEndVal(0, i), getEndVal(1, i), getEndVal(2, i)));
                if(i === 0) {
                    line = new THREE.Line(lineGeometry, darkLineMaterial);    
                } else {
                    line = new THREE.Line(lineGeometry, lightLineMaterial);    
                }
                
                scene.add(line);
            }
        };

        drawGrid([0, 1, 0], [2, 1, 0]);
        drawGrid([0, 0, 1], [2, 0, 1]);
        drawGrid([0, 1, 0], [0, 1, 2]);
        drawGrid([0, 0, 1], [0, 2, 1]);
        drawGrid([1, 0, 0], [1, 2, 0]);
        drawGrid([1, 0, 0], [1, 0, 2]);
    },

    render: function() {
        var width = this.width;
        var height = this.height;
        var selector = this.selector;
        var data = this.data;
        var opts = this.opts;
        var max = this.max;
        var points = data.points;
        var scene = this.scene;
        var geometry = this.geometry;

        var container, stats;
        var controls;
        var camera, headlight, renderer, particles, materials = [], parameters, i, h, color, size;
        var mouseX = 0, mouseY = 0;

        var halfWidth = width / 2;
        var halfHeight = height / 2;

        var self = this;

        function init() {

            camera = new THREE.PerspectiveCamera( 50, width / height, 1, 3000 );
            headlight = new THREE.PointLight ( 0xFFFFFF, 1.0 );

            var avgs = [0, 0, 0];

            _.each(data.points, function(p) {
                avgs[0] += p.y;
                avgs[1] += p.z;
                avgs[2] += p.x;
            });

            avgs = _.map(avgs, function(n) { return n / data.points.length; });

            self.renderGrid();

            var sphereGeometry, sphereMaterial, sphere, sphereOutline, sphereOutlineMaterial;
            var sphereMaterials = [];
            var sphereTotalGeom = new THREE.Geometry();

            _.each(data.points, function(p, i) {

                var s = p.s || self.defaultSize
                var widthSegments = Math.min(64, Math.max(8, 2 * 0.008 * max * s))
                var heightSegments = Math.min(64, Math.max(6, 2 * 0.008 * max * s))
                sphereGeometry = new THREE.SphereGeometry( 0.008 * max * s, widthSegments, heightSegments);

                var rgb = p.c || self.defaultColor;

                sphereMaterial = new THREE.MeshLambertMaterial( {  color: rgb.toString(), emissive: 0x333333, ambient: rgb.toString(), vertexColors: THREE.FaceColors} ) 

                sphereMaterials.push(sphereMaterial);
                sphereMaterial.opacity = p.a || 1;
                sphereMaterial.transparent = true;
                sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
                sphere.position.set(p.y, p.z, p.x);

                sphere.updateMatrix();
                sphereTotalGeom.merge(sphere.geometry, sphere.matrix, i);

            });

            var totalMaterials = new THREE.MeshFaceMaterial(sphereMaterials);
            var total = new THREE.Mesh(sphereTotalGeom, totalMaterials);
            total.updateMatrix();
            scene.add(total);

            var maxScale = 2.00
            var camPos = max * maxScale;

            camera.position.y = camPos;
            camera.position.x = camPos;
            camera.position.z = camPos;

            camera.lookAt(new THREE.Vector3(0, 0, 0));

            renderer = new THREE.WebGLRenderer({alpha: true, antialias:true});        
            renderer.setSize( width, height );
            $(selector)[0].appendChild( renderer.domElement );

            $(selector).children('canvas').css('border','1px solid rgb(200,200,200)')
            $(selector).children('canvas').css('outline','-moz-outline-style: none; ')

            scene.add(headlight);

            self.scene = scene;
            self.parameters = parameters;
            controls = new THREE.FlyControls(camera, $(selector)[0], { movementSpeed: 0.025 * max});

        }

        function animate() {
            requestAnimationFrame( animate );
            render();
        }

        function render() {
            controls.update();
            headlight.position.copy( camera.position );
            renderer.render( scene, camera );
        }

        init();
        animate();
    },

    formatData: function(data) {
        data = data || {points: []};
        var retColor = utils.getColorFromData(data);
        var retSize = data.size || [];
        var retAlpha = data.alpha || [];

        console.log(data);

        data.points = data.points.map(function(d, i) {
            var p = [];
            p.x = d[0];
            p.y = d[1];
            p.z = d[2];
            p.i = i;
            p.c = retColor.length > 1 ? retColor[i] : retColor[0];
            p.s = retSize.length > 1 ? retSize[i] : retSize[0];
            p.a = retAlpha.length > 1 ? retAlpha[i] : retAlpha[0];
            return p;
        });

        var maxPoint = _.max(data.points, function(p) {
            return Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
        });
        this.max = Math.max(Math.abs(maxPoint.x), Math.abs(maxPoint.y), Math.abs(maxPoint.z));

        return data;
    },

    appendData: function(formattedData) {    
        
        var sphereGeometry, sphereMaterial, sphere, sphereOutline, sphereOutlineMaterial;
        var sphereMaterials = [];
        var sphereTotalGeom = new THREE.Geometry();

        _.each(formattedData.points, function(p, i) {

            var s = p.s || self.defaultSize
            var widthSegments = Math.min(64, Math.max(8, 2 * 0.008 * max * s))
            var heightSegments = Math.min(64, Math.max(6, 2 * 0.008 * max * s))
            sphereGeometry = new THREE.SphereGeometry( 0.008 * max * s, widthSegments, heightSegments);

            var rgb = p.c || self.defaultColor;

            sphereMaterial = new THREE.MeshLambertMaterial( {  color: rgb.toString(), emissive: 0x333333, ambient: rgb.toString(), vertexColors: THREE.FaceColors} ) 

            sphereMaterials.push(sphereMaterial);
            sphereMaterial.opacity = p.a || 1;
            sphereMaterial.transparent = true;
            sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
            sphere.position.set(p.y, p.z, p.x);

            sphere.updateMatrix();
            sphereTotalGeom.merge(sphere.geometry, sphere.matrix, i);

        }, this);
        

        var totalMaterials = new THREE.MeshFaceMaterial(sphereMaterials);
        var total = new THREE.Mesh(sphereTotalGeom, totalMaterials);
        total.updateMatrix();
        this.scene.add(total);

    }

});


module.exports = Scatter3;
