/* Show basin of attraction of the complex roots of specified function
   Roots are computed through Newton's method, i.e. iteraing:

                    r_(n+1) = r_n - f(r_n) / f'(r_n)

   Semidan Robaina Estevez (semidanrobaina.com)
*/

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

let cnv_o;
class ComplexCanvas {
  /* Creates a canvas to plot basin of attraction and an overlapping
     canvas to plot the selection rectangle
  */
  constructor(cnv_id, f, fp,
              real_min, real_max, imag_min, imag_max) {
    let grid_item = document.getElementsByClassName("grid_item")[0];
    this.cnv = document.getElementById(cnv_id);
    this.cnv.width = grid_item.clientWidth;
    this.cnv.height = grid_item.clientHeight;
    this.cnv_width = this.cnv.width;
    this.cnv_height = this.cnv.height;
    this.ctx = this.cnv.getContext('2d');
    this.f = f;
    this.fp = fp;
    this.real_min = real_min || -Math.PI;
    this.real_max = real_max || Math.PI;
    this.imag_min = imag_min || -Math.PI;
    this.imag_max = imag_max || Math.PI;
  }

  drawBasinOfAttraction(color_function) {
    /* Returns 2D array classifying the points in a complex grid into the n
       basins of attraction of the input function
    */
    let w_pixels = this.cnv.width;
    let h_pixels = this.cnv.height;
    const rangeStep = (start, stop, n_points) => (stop - start) / n_points;
    let w_step = rangeStep(this.real_min, this.real_max, w_pixels);
    let h_step = rangeStep(this.imag_min, this.imag_max, h_pixels);

    for (let j=0; j<h_pixels; j++) {
      for (let i=0; i<w_pixels; i++) {

        let real = this.real_min + i * w_step;
        let imag = this.imag_min + j * h_step;
        let z = new Complex(real, imag);
        let out_root = this._findComplexRoot(this.f, this.fp, z);

        this._fillCanvasPixel(i, j, out_root, color_function);
      }
    }
  }

  _findComplexRoot(f, fp, r_0, tol=1e-3) {
    /* Find complex roots of function 'f' via Newton's method */

    function updateRootGuess(f, fp, r_n) {
        return r_n.subtract(f(r_n).divide(fp(r_n)))
    }

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

  _fillCanvasPixel(pixel_i, pixel_j, out_root, color_function) {
    let factor = Math.sqrt(out_root["niter"]) / Math.sqrt(10);
    if (factor > 0) {
        let colors = color_function(out_root);
        // let color = `rgba(${colors.red}, ${colors.green}, ${colors.blue}, ${1/factor})`
        let color = `rgb(${colors.red}, ${colors.green}, ${colors.blue}`
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixel_i, pixel_j, 1, 1);
    } else {
        this.ctx.fillRect(pixel_i, pixel_j, 1, 1);
    }
  }

}


/* FUNCTIONS */
class Functions {
  constructor() {
    this.one = new Complex(1, 0);
    // this.two = new Complex(2, 0);
    this.three = new Complex(3, 0);
    this.five = new Complex(5, 0);
    this.six = new Complex(6, 0);
    this.seven = new Complex(7, 0);

    this.z3 = (z) => z.multiply(z).multiply(z).subtract(this.one);
    this.z3p = (z) => this.three.multiply(z).multiply(z);
    this.z5 = (z) => z.multiply(z).multiply(z).multiply(z).multiply(z).subtract(this.one);
    this.z5p = (z) => this.five.multiply(z).multiply(z).multiply(z).multiply(z);
    this.z6 = (z) => z.multiply(z).multiply(z).multiply(z).multiply(z).multiply(z).subtract(this.one);
    this.z6p = (z) => this.six.multiply(z).multiply(z).multiply(z).multiply(z).multiply(z);
    this.z7 = (z) => z.multiply(z).multiply(z).multiply(z).multiply(z).multiply(z).multiply(z).subtract(this.one);
    this.z7p = (z) => this.seven.multiply(z).multiply(z).multiply(z).multiply(z).multiply(z).multiply(z);
    this.sin = (z) => z.sin();
    this.sinp = (z) => z.cos();
    this.tan = (z) => z.tan();
    this.tanp = (z) => this.one.divide(z.cos().cos());
  }
}

function colorFunctionA(data) {
  let red = 100*data["root"].r;
  let blue =  100*data["root"].r;
  let green = 100*data["root"].i;
  return {"red": red, "blue": blue, "green": green}
}

function colorFunctionB(data) {
  let red = 100*data["root"].i;
  let blue =  100*data["root"].r;
  let green = 1*data["root"].i;
  return {"red": red, "blue": blue, "green": green}
}

function colorFunctionC(data) {
  let red = 0*data["root"].i;
  let blue =  100*data["root"].r;
  let green = 0*data["root"].i;
  return {"red": red, "blue": blue, "green": green}
}

function colorFunctionD(data) {
  let red = 0*data["root"].i;
  let blue =  100*data["root"].r;
  let green = 100*data["root"].r;
  return {"red": red, "blue": blue, "green": green}
}


let f = new Functions();
let canvas0 = new ComplexCanvas("basin-canvas-0", f.z5, f.z5p);
canvas0.drawBasinOfAttraction(colorFunctionA);

let canvas1 = new ComplexCanvas("basin-canvas-1", f.tan, f.tanp);
canvas1.drawBasinOfAttraction(colorFunctionB);

let canvas2 = new ComplexCanvas("basin-canvas-2", f.sin, f.sinp);
canvas2.drawBasinOfAttraction(colorFunctionC);

let canvas3 = new ComplexCanvas("basin-canvas-3", f.z7, f.z7p);
canvas3.drawBasinOfAttraction(colorFunctionD);
