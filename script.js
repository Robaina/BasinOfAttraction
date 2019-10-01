/* Show basin of attraction of the complex roots of specified function
   Roots are computed through Newton's method, i.e. iteraing:

                    r_(n+1) = r_n - f(r_n)/f'(r_n)

   Semidan Robaina Estevez (semidanrobaina.com)
*/

let cnv_width = window.innerWidth / 2;
let cnv_height = window.innerHeight / 2;

let cnv_0 = document.getElementById("basin-canvas-0");
let cnv_0_width = cnv_width;
let cnv_0_height = cnv_height;
cnv_0.setAttribute('width', cnv_0_width);
cnv_0.setAttribute('height', cnv_0_height);
let ctx_0 = cnv_0.getContext('2d');

let x_0_min = -Math.PI / 1;
let x_0_max = Math.PI / 1;
let y_0_min = -((x_0_max - x_0_min) / cnv_0_width) * 0.5 * cnv_0_height;
let y_0_max = ((x_0_max - x_0_min) / cnv_0_width) * 0.5 * cnv_0_height;

let cnv_1 = document.getElementById("basin-canvas-1");
let cnv_1_width = cnv_width;
let cnv_1_height = cnv_height;
cnv_1.setAttribute('width', cnv_1_width);
cnv_1.setAttribute('height', cnv_1_height);
let ctx_1 = cnv_1.getContext('2d');

let x_1_min = -Math.PI / 1;
let x_1_max = Math.PI / 1;
let y_1_min = -((x_1_max - x_1_min) / cnv_1_width) * 0.5 * cnv_1_height;
let y_1_max = ((x_1_max - x_1_min) / cnv_1_width) * 0.5 * cnv_1_height;

let cnv_2 = document.getElementById("basin-canvas-2");
let cnv_2_width = cnv_width;
let cnv_2_height = cnv_height;
cnv_2.setAttribute('width', cnv_2_width);
cnv_2.setAttribute('height', cnv_2_height);
let ctx_2 = cnv_2.getContext('2d');

let x_2_min = -Math.PI / 1;
let x_2_max = Math.PI / 1;
let y_2_min = -((x_2_max - x_2_min) / cnv_2_width) * 0.5 * cnv_2_height;
let y_2_max = ((x_2_max - x_2_min) / cnv_2_width) * 0.5 * cnv_2_height;



class Complex {
    constructor(real, imag) {
        this.r = real || 0;
        this.i = imag || 0;
    }
    add(other) {
        return new Complex(this.r + other.r, this.i + other.i)
    }
    subtract(other) {
        return new Complex(this.r - other.r, this.i - other.i)
    }
    multiply(other) {
        return new Complex(this.r * other.r - this.i * other.i,
                       this.i * other.r + this.r * other.i)
    }
    divide(other) {
        let denominator = other.r * other.r + other.i * other.i;
        return new Complex((this.r * other.r + this.i * other.i) / denominator,
                          (this.i * other.r - this.r * other.i) / denominator)
    }
    pow(n) {
        let r = Math.sqrt(this.r**2 + this.i**2);
        let theta = Math.atan(this.i / this.r);
        return new Complex(r**n * Math.cos(n*theta), r**n * Math.sin(n*theta))
    }
    round(n_decimals) {
        let factor = n_decimals*10;
        return new Complex(Math.round(this.r*factor)/factor,
                           Math.round(this.i*factor)/factor)
    }
    sin() {
        // sin(a+bi)=sinacoshb+icosasinhb
        return new Complex(Math.sin(this.r)*Math.cosh(this.i),
                           Math.cos(this.r)*Math.sinh(this.i))
    }
    cos() {
        // cos(a+bi)=cosacoshb−isinasinhb
        return new Complex(Math.cos(this.r)*Math.cosh(this.i),
                           -Math.sin(this.r)*Math.sinh(this.i))
    }
    tan() {
        // tan(a+bi)=sin2a+isinh2b / (cos2a+cosh2b)
        let denominator = Math.cos(2*this.r) + Math.cosh(2*this.i);
        return new Complex(Math.sin(2*this.r)/denominator,
                           Math.sinh(2*this.i)/denominator)
    }
}


class ComplexCanvas {
  /* Creates a canvas to plot basin of attraction and an overlapping
     canvas to plot the selection rectangle
  */
  constructor(cnv_id, f, fp, cnv_width, cnv_height,
              real_min, real_max, imag_min, imag_max) {
    this.cnv = document.getElementById(cnv_id);
    this.cnv_width = cnv_width || window.innerWidth / 2;
    this.cnv_height = cnv_height || window.innerHeight / 2;
    this.cnv.setAttribute('width', this.cnv_width);
    this.cnv.setAttribute('height', this.cnv_height);
    this.ctx = this.cnv.getContext('2d');
    this.f = f;
    this.fp = fp;
    this.real_min = real_min || -Math.PI;
    this.real_max = real_max || Math.PI;
    this.imag_min = imag_min || -Math.PI;
    this.imag_max = imag_max || Math.PI;
  }

  drawBasinOfAttraction() {
    /* Returns 2D array classifying the points in a complex grid into the n
       basins of attraction of the input function
    */
    let w_pixels = this.cnv.width;
    let h_pixels = this.cnv.height;
    const rangeStep = (start, stop, n_points) => (stop - start) / n_points;

    w_step = rangeStep(this.real_min, this.real_max, w_pixels);
    h_step = rangeStep(this.imag_min, this.imag_max, h_pixels);

    // let color, green, blue, red, factor;
    for (let j=0; j<h_pixels; j++) {

      for (let i=0; i<w_pixels; i++) {

        let real = this.real_min + i * w_step;
        let imag = this.imag_min + j * h_step;
        let z = new Complex(real, imag);
        let out_root = this._findComplexRoot(z);

        this._fillCanvasPixel(i, j, out_root);
      }
    }
  }

  _findComplexRoot(r_0, tol=1e-6) {
    /* Find complex roots of function 'f' via Newton's method */

    function updateRootGuess(f, fp, r_n) {
        return r_n.subtract(f(r_n).divide(fp(r_n)))
    }

    let n_decimals = 6;
    let n_iter = 0;
    let r_n = updateRootGuess(this.f, this.fp, r_0);;
    let r_np1 = updateRootGuess(this.f, this.fp, r_n);

    while (Math.abs(r_n.r - r_np1.r) > tol) {
      n_iter++;
      r_n = r_np1;
      r_np1 = updateRootGuess(this.f, this.fp, r_np1);
    }
    return {"root": r_np1.round(n_decimals), "niter": n_iter}
  }

  _fillCanvasPixel(pixel_i, pixel_j, data) {
    let color, red, green, blue;
    let factor = Math.sqrt(data["niter"])/Math.sqrt(10);
    // color = `rgba(${red},${green}, ${blue}, ${factor})`;
    if (factor > 0) {
        red = 50 * (1 / factor);//data["root"].i*150*(1/factor);
        blue = 50 * (1 / factor);
        green = 50 * (1 / factor);//data["root"].r*150*(1/factor);
        color = `rgb(${red},${green}, ${blue})`;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixel_i, pixel_j, 1, 1);
    } else {
        this.ctx.fillRect(pixel_i, pixel_j, 1, 1);
    }
  }

}


const rangeStep = (start, stop, n_points) => (stop - start) / n_points;
let w_step, h_step;

const one = new Complex(1, 0);
const two = new Complex(2, 0);
const three = new Complex(3, 0);
const five = new Complex(5, 0);
const six = new Complex(6, 0);
const seven = new Complex(7, 0);


// const f_0 = (z) => z.multiply(z).multiply(z).subtract(one);
// const fp_0 = (z) => three.multiply(z).multiply(z);

const f_0 = (z) => z.multiply(z).multiply(z).multiply(z).multiply(z).subtract(one);
const fp_0 = (z) => five.multiply(z).multiply(z).multiply(z).multiply(z);

// const f = (z) => z.multiply(z).multiply(z).multiply(z).multiply(z).multiply(z).subtract(one);
// const fp = (z) => six.multiply(z).multiply(z).multiply(z).multiply(z).multiply(z);

// const f = (z) => z.multiply(z).multiply(z).multiply(z).multiply(z).multiply(z).multiply(z).subtract(one);
// const fp = (z) => seven.multiply(z).multiply(z).multiply(z).multiply(z).multiply(z).multiply(z);

// const f = (z) => z.sin();
// const fp = (z) => z.cos();

// const f = (z) => z.multiply(z).multiply(z).add(z.multiply(z)).subtract(one);
// const fp = (z) => three.multiply(z.multiply(z)).add(two.multiply(z));

const f_1 = (z) => z.tan();
const fp_1 = (z) => one.divide(z.cos().cos());


function drawBasinOfAttraction(ctx, f, fp, real_min, real_max,
                               imag_min, imag_max) {

  /* Returns 2D array classifying the points in a complex grid into the n
     basins of attraction of the input function
  */

  real_min = typeof real_min !== 'undefined' ? real_min : -10;
  real_max = typeof real_max !== 'undefined' ? real_max : 10;
  imag_min = typeof imag_min !== 'undefined' ? imag_min : -10;
  imag_max = typeof imag_max !== 'undefined' ? imag_max : 10;

  let w_pixels = cnv_0.width;
  let h_pixels = cnv_0.height;

  w_step = rangeStep(real_min, real_max, w_pixels);
  h_step = rangeStep(imag_min, imag_max, h_pixels);

  let color, green, blue, red, factor;
  for (let j=0; j<h_pixels; j++) {

    for (let i=0; i<w_pixels; i++) {

      let real = real_min + i * w_step;
      let imag = imag_min + j * h_step;
      let z = new Complex(real, imag);
      let out_root = findComplexRoot(f, fp, z, tol=1e-6);

      fillCanvasPixel(ctx, i, j, out_root);

    }

  }

}


function fillCanvasPixel(ctx, pixel_i, pixel_j, data) {
  factor = Math.sqrt(data["niter"])/Math.sqrt(10);
  // factor = Math.log(data["niter"])/Math.log(15);
  // factor = data["niter"] / 15;
  // color = `rgba(${red},${green}, ${blue}, ${factor})`;
  if (factor > 0) {
      red = 50*(1/factor);//data["root"].i*150*(1/factor);
      blue = 50*(1/factor);
      green = 50*(1/factor);//data["root"].r*150*(1/factor);
      color = `rgb(${red},${green}, ${blue})`;
      ctx.fillStyle = color;
      ctx.fillRect(pixel_i, pixel_j, 1, 1);
  } else {
      ctx.fillRect(pixel_i, pixel_j, 1, 1);
  }
}

function updateRootGuess(f, fp, r_n) {
    return r_n.subtract(f(r_n).divide(fp(r_n)))
}


function findComplexRoot(f, fp, r_0, tol=1e-10) {

  /* Find complex roots of function 'f' via Newton's method.
     f_expresion: string, a function expression to be parsed by math.js.
     r_0: initial guess for the root
     tol: float, numerical tolerance to stop the iteration. Namely,
          iteration stops when ||r_(n+1) - r_n||_2 <= tol
     max_iter: int, maximum number of iterations (in case newton's does not
               converge for given tolerance)
     var_name: string, variable name of the function in f_expression

     Semidan Robaina Estevez (semidanrobaina.com)
  */

  //r_0 = typeof r_0 !== 'undefined' ? r_0 : math.complex(0, 1);
  //tol = typeof tol !== 'undefined' ? tol : 1e-2;
  let n_decimals = 6;


  let n_iter = 0;
  let r_n = updateRootGuess(f, fp, r_0);;
  let r_np1 = updateRootGuess(f, fp, r_n);

  while (Math.abs(r_n.r - r_np1.r) > tol) {
    n_iter++;
    r_n = r_np1;
    r_np1 = updateRootGuess(f, fp, r_np1);
  }

  return {"root": r_np1.round(n_decimals), "niter": n_iter}

}



// *******************************
console.time("basin");
drawBasinOfAttraction(ctx_1, f_0, fp_0, real_min=x_0_min, real_max=x_0_max,
                      imag_min=y_0_min, imag_max=y_0_max);
console.timeEnd("basin");
//
// drawBasinOfAttraction(ctx_1, f_1, fp_1, real_min=x_1_min, real_max=x_1_max,
//                       imag_min=y_1_min, imag_max=y_1_max);


let canvas1 = new ComplexCanvas("basin-canvas-0", f_0, fp_0);
console.time("basin-class");
canvas1.drawBasinOfAttraction();
console.timeEnd("basin-class");
