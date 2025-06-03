import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
  });

  const [order, setOrder] = useState({
    product_id: "",
    quantity: "",
    customer_name: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/products")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch products");
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
        alert("Failed to load products. Check console for details.");
      });
  }, []);

  const categories = [...new Set(products.map((p) => p.category))];

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.category) {
      alert("Name and category are required");
      return;
    }

    const price = parseFloat(newProduct.price);
    const stock = parseInt(newProduct.stock);

    if (isNaN(price)) {
      alert("Price must be a valid number");
      return;
    }
    if (isNaN(stock)) {
      alert("Stock must be a valid number");
      return;
    }

    const product = {
      ...newProduct,
      price,
      stock,
    };

    fetch("http://localhost:8000/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((errData) => {
            throw new Error(errData.message || "Validation failed");
          });
        }
        return res.json();
      })
      .then((savedProduct) => {
        setProducts([...products, savedProduct]);
        setNewProduct({ name: "", price: "", stock: "", category: "" });
        alert("Product added successfully!");
      })
      .catch((err) => {
        console.error("Add product error:", err);
        alert(`Failed to add product: ${err.message}`);
      });
  };

  const handleEdit = (productId) => {
    const product = products.find((p) => p.id === productId);
    const newName = prompt("Edit name:", product.name);
    const newStock = prompt("Edit stock:", product.stock);
    const newPrice = prompt("Edit price:", product.price);

    if (
      newName === null ||
      newStock === null ||
      newPrice === null ||
      newName.trim() === "" ||
      isNaN(newStock) ||
      isNaN(newPrice)
    ) {
      alert("Invalid input.");
      return;
    }

    const updatedProduct = {
      ...product,
      name: newName.trim(),
      stock: parseInt(newStock),
      price: parseFloat(newPrice),
    };

    fetch(`http://localhost:8000/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProduct),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update product");
        setProducts(
          products.map((p) => (p.id === productId ? updatedProduct : p))
        );
      })
      .catch((err) => {
        console.error("Update error:", err);
        alert("Failed to update product. Check console for details.");
      });
  };

  const handleDelete = (productId) => {
    if (window.confirm("Delete this product?")) {
      fetch(`http://localhost:8000/products/${productId}`, {
        method: "DELETE",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to delete product");
          setProducts(products.filter((p) => p.id !== productId));
        })
        .catch((err) => {
          console.error("Delete error:", err);
          alert("Failed to delete product. Check console for details.");
        });
    }
  };

  const placeOrder = () => {
    if (
      !order.product_id ||
      !order.quantity ||
      isNaN(order.quantity) ||
      parseInt(order.quantity) <= 0 ||
      !order.customer_name.trim()
    ) {
      alert("Please fill all order fields correctly.");
      return;
    }

    fetch("http://localhost:8000/orders/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...order,
        product_id: parseInt(order.product_id),
        quantity: parseInt(order.quantity),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to place order");
        return res.json();
      })
      .then((data) => {
        alert(data.message || "Order submitted successfully");
        setOrder({ product_id: "", quantity: "", customer_name: "" });
      })
      .catch((err) => {
        console.error("Order error:", err);
        alert("Failed to place order. Check console for details.");
      });
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="app">
      <header className="header">
        <h1>StockPilot</h1>
        <div className="add-product-form">
          <input
            type="text"
            placeholder="Name"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: e.target.value })
            }
            min="0"
            step="0.01"
            required
          />
          <input
            type="number"
            placeholder="Stock"
            value={newProduct.stock}
            onChange={(e) =>
              setNewProduct({ ...newProduct, stock: e.target.value })
            }
            min="0"
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={newProduct.category}
            onChange={(e) =>
              setNewProduct({ ...newProduct, category: e.target.value })
            }
            required
          />
          <button
            className="btn-add"
            onClick={handleAddProduct}
            disabled={loading}
          >
            Add Product
          </button>
        </div>
      </header>

      <div className="search-filter">
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Product List */}
      <div className="product-list">
        {loading ? (
          <p className="loading">Loading...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="no-products">No products found</p>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="product-card"
              style={{
                backgroundColor: product.stock < 5 ? "red" : "white",
              }}
            >
              <div className="product-info">
                <h3>{product.name}</h3>
                <p>Price: KSH {product.price.toFixed(2)}</p>
                <p>Stock: {product.stock}</p>
                <p>Category: {product.category}</p>
                {product.stock < 5 && <p className="warning">Low Stock!</p>}
              </div>
              <div className="product-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEdit(product.id)}
                >
                  Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(product.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Form */}
      <div className="order-form">
        <h2>Place an Order</h2>
        <select
          value={order.product_id}
          onChange={(e) => setOrder({ ...order, product_id: e.target.value })}
          required
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Quantity"
          value={order.quantity}
          onChange={(e) => setOrder({ ...order, quantity: e.target.value })}
          min="1"
          required
        />
        <input
          type="text"
          placeholder="Customer Name"
          value={order.customer_name}
          onChange={(e) =>
            setOrder({ ...order, customer_name: e.target.value })
          }
          required
        />
        <button onClick={placeOrder} disabled={loading}>
          Place Order
        </button>
      </div>
    </div>
  );
}

export default App;
