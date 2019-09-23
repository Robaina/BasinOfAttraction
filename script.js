/* Show basin of attraction of the complex roots of specified function
   Roots are computed through Newton's method, i.e. iteraing:

                    r_(n+1) = r_n - f(r_n)/f'(r_n)

   Semidan Robaina Estevez (semidanrobaina.com)
*/

let cnv = document.getElementById("basin-canvas");
let cnv_width = window.innerWidth/1;
let cnv_height = window.innerHeight/1;
cnv.setAttribute('width', cnv_width);
cnv.setAttribute('height', cnv_height);
let ctx = cnv.getContext('2d');

let x_min = -Math.PI/1;
let x_max = Math.PI/1;
let y_min = -((x_max - x_min) / cnv_width) * 0.5 * cnv_height;
let y_max = ((x_max - x_min) / cnv_width) * 0.5 * cnv_height;



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


//const rangeStep = (start, stop, n_points) => (stop - start) / n_points;
//let w_step, h_step;


function findBasinOfAttraction(f_expresion, real_min, real_max,
                               imag_min, imag_max) {

  /* Returns 2D array classifying the points in a complex grid into the n
     basins of attraction of the input function
  */
  
  //const f = math.parse(f_expresion).compile();
  //const fp = math.derivative(f_expresion, "z").compile();

  const one = new Complex(1, 0);
  const two = new Complex(2, 0);
  const three = new Complex(3, 0); 
  const five = new Complex(5, 0);  
  
  // const f = (z) => z.pow(3).subtract(one); // super slow! wow
  // const fp = (z) => three.multiply(z.pow(2));
  
  // const f = (z) => z.multiply(z).multiply(z).subtract(one);
  // const fp = (z) => three.multiply(z).multiply(z);
  
  // const f = (z) => z.multiply(z).multiply(z).multiply(z).multiply(z).subtract(one);
  // const fp = (z) => five.multiply(z).multiply(z).multiply(z).multiply(z);
  
  // const f = (z) => z.sin();
  // const fp = (z) => z.cos();
  
  const f = (z) => z.tan();
  const fp = (z) => one.divide(z.cos().multiply(z.cos()));
  
  // const f = (z) => z.multiply(z).multiply(z).add(z.multiply(z)).subtract(one);
  // const fp = (z) => three.multiply(z.multiply(z)).add(two.multiply(z));



  real_min = typeof real_min !== 'undefined' ? real_min : -10;
  real_max = typeof real_max !== 'undefined' ? real_max : 10;
  imag_min = typeof imag_min !== 'undefined' ? imag_min : -10;
  imag_max = typeof imag_max !== 'undefined' ? imag_max : 10;

  let w_pixels = cnv.width;
  let h_pixels = cnv.height;

  // const rangeStep = (start, stop, n_points) => (stop - start) / n_points;
  // const w_step = rangeStep(real_min, real_max, w_pixels);
  // const h_step = rangeStep(imag_min, imag_max, h_pixels);
  w_step = rangeStep(real_min, real_max, w_pixels);
  h_step = rangeStep(imag_min, imag_max, h_pixels);
  
  let color, green, blue, red, factor;
  for (let j=0; j<h_pixels; j++) {
    
    for (let i=0; i<w_pixels; i++) {
        

      let real = real_min + i * w_step;
      let imag = imag_min + j * h_step;
      let z = new Complex(real, imag);
      let out = findComplexRoot(f, fp, z, tol=1e-6);
      
      factor = Math.sqrt(out["niter"])/Math.sqrt(10);
      // factor = Math.log(out["niter"])/Math.log(15);
      // factor = out["niter"] / 15;
      // color = `rgba(${red},${green}, ${blue}, ${factor})`;
      if (factor > 0) {
          blue = out["root"].i*150;//*(1/factor);
          red = 50;//*(1/factor);
          green = out["root"].r*150;//*(1/factor);
          color = `rgb(${red},${green}, ${blue})`;
          ctx.fillStyle = color;
          ctx.fillRect(i, j, 1, 1);
      } else {
          ctx.fillRect(i, j, 1, 1);
      }

      

    }

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
let basin = findBasinOfAttraction("z^3 - 1", real_min=x_min, real_max=x_max,
                                  imag_min=y_min, imag_max=y_max);
console.timeEnd("basin");

