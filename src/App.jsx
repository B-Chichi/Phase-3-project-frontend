import { useState,useEffect } from "react";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetch("http://localhost:8000/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
      });
  }, []);
  
  return (
    <div id="div">
      {products.map((product) => (
        <div key={product.id}>
          <h3>Name:{product.name}</h3>
          <p>Price:{product.price}</p>
          <p>No. of stock:{product.stock}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
