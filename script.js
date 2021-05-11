/* Show basin of attraction of the complex roots of specified function
   Roots are computed through Newton's method, i.e. iteraing:

                    r_(n+1) = r_n - f(r_n)/f'(r_n)

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
  constructor(cnv_id, f, fp, cnv_width, cnv_height,
              real_min, real_max, imag_min, imag_max) {
    this.cnv = document.getElementById(cnv_id);
    this.cnv_width = cnv_width || this.cnv.width;
    this.cnv_height = cnv_height || this.cnv.height;
    this.cnv.setAttribute('width', this.cnv_width);
    this.cnv.setAttribute('height', this.cnv_height);
    this.ctx = this.cnv.getContext('2d');
    this.f = f;
    this.fp = fp;
    this.real_min = real_min || -Math.PI;
    this.real_max = real_max || Math.PI;
    this.imag_min = imag_min || -Math.PI;
    this.imag_max = imag_max || Math.PI;

    // // Create overlapping canvas to draw selection rectangle
    // this.cnv_o = document.createElement("canvas");
    // document.body.append(this.cnv_o);
    // this.cnv_o.setAttribute('width', this.cnv_width);
    // this.cnv_o.setAttribute('height', this.cnv_height);
    // this.cnv_o.style.position = "absolute";
    // this.cnv_o.style.top = this.cnv.offsetTop;
    // this.cnv_o.style.left = this.cnv.offsetLeft;
    // this.cnv_o.style["z-index"] = 2;
    // this.cnv_o.style["background-color"] = "transparent";
    // this.ctx_o = this.cnv.getContext('2d');
    // this._clearSelectionCanvas();
  }

  drawBasinOfAttraction() {
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

        this._fillCanvasPixel(i, j, out_root);
      }
    }

    // this.ctx_o.beginPath();
    // this.ctx_o.lineWidth = "5";
    // this.ctx_o.strokeStyle = "rgba(255, 0, 0, 0.75)";
    // this.ctx_o.rect(0, 0, 100, 100);
    // this.ctx_o.stroke();
    // this.ctx_o.clearRect(0,0,100,100);

    // this.drawSelection(10, 10, 100, 50);
    // this._clearSelectionCanvas();

  }

  _findComplexRoot(f, fp, r_0, tol=1e-6) {
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

  _fillCanvasPixel(pixel_i, pixel_j, data) {
    let color, red, green, blue;
    let factor = Math.sqrt(data["niter"]) / Math.sqrt(10);
    // color = `rgba(${red},${green}, ${blue}, ${factor})`;
    if (factor > 0) {
        red = 50*data["root"].i*150*(1/factor);
        blue =  50*data["root"].i*150;
        green = 50*data["root"].r*150*(1/factor);
        color = `rgba(${red}, ${green}, ${blue}, ${factor})`;
        //color = `rgba(${251}, ${251}, ${251}, ${factor})`;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixel_i, pixel_j, 1, 1);
    } else {
        this.ctx.fillRect(pixel_i, pixel_j, 1, 1);
    }
  }

 drawSelection(i, j, width, height) {
   if (cnv_o !== null) {document.body.remove(cnv_o);} // this causes body to be null!! Wtf...
   cnv_o = document.createElement("canvas");
   console.log(document.body);
   document.body.append(cnv_o);
   cnv_o.setAttribute('width', this.cnv_width);
   cnv_o.setAttribute('height', this.cnv_height);
   cnv_o.style.position = "absolute";
   cnv_o.style.top = this.cnv.offsetTop;
   cnv_o.style.left = this.cnv.offsetLeft;
   cnv_o.style["z-index"] = 2;
   cnv_o.style["background-color"] = "rgba(255, 255, 255, 0)";
   let ctx_o = this.cnv.getContext('2d');

   // Seems very hard to just clear this canvas... overwritting it does not work. Clearing rect does not work, making temp canvas does not work...

   // clear canvas
   // this.ctx_o.clearRect(0, 0, this.cnv_o.width, this.cnv_o.height);
   // this._clearSelection(0, 0, 100, 100);
   // this.cnv_o.style["background-color"] = "rgba(255, 255, 255, 0)";
   // this.ctx_o.beginPath();
   // this.ctx_o.fillStyle = "rgba(100, 0, 0, 1)";
   // this.ctx_o.rect(0, 0, this.cnv_o.width, this.cnv_o.height);
   // this.ctx_o.fill();

   // draw rectangle
   // ctx_o.beginPath();
   // ctx_o.lineWidth = "5";
   // ctx_o.strokeStyle = "rgba(255, 0, 0, 0.75)";
   // ctx_o.strokeRect(i, j, width, height);
   // ctx_o.stroke();
 }

 _clearSelection(i, j, width, height) {
   this.ctx_o.fillStyle = "rgba(0, 100, 0, 0.8)";
   for (let a=i; a<i+width; a++) {
     for (let b=j; b<j+height; b++) {
       this.ctx.fillRect(a, b, 1, 1);
     }
   }
 }

 _clearSelectionCanvas() {
   let imageData = this.ctx_o.getImageData(0, 0, this.cnv_o.width, this.cnv_o.height);
   for (let i=3; i<imageData.data.length; i+=4) {
     imageData.data[i] = 0;
   }
   this.ctx_o.putImageData(imageData, 0, 0);
 }

 _complexToPixelCoordinates(complex_r, complex_i) {
   let leftCorner = {
     "i": this._complexToPixelCoordinates(real_min),
     "j": this._complexToPixelCoordinates(imag_max)
   };
   let rectSize = {
     "w": this._complexToPixelCoordinates(real_max - real_min),
     "h": this._complexToPixelCoordinates(imag_max - imag_min)
   };
   return
 }

 _pixelToComplexCoordinates(pixel_i, pixel_j) {
   let real = this.real_min + pixel_i * w_step;
   let imag = this.imag_min + pixel_j * h_step;
   return
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


let f = new Functions();
let canvas0 = new ComplexCanvas("basin-canvas-0", f.z5, f.z5p);
canvas0.drawBasinOfAttraction();

let canvas1 = new ComplexCanvas("basin-canvas-1", f.tan, f.tanp);
canvas1.drawBasinOfAttraction();

let canvas2 = new ComplexCanvas("basin-canvas-2", f.sin, f.sinp);
canvas2.drawBasinOfAttraction();

let canvas3 = new ComplexCanvas("basin-canvas-3", f.z7, f.z7p);
canvas3.drawBasinOfAttraction();
