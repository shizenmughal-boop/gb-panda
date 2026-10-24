const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Hungry? 🐼<br />Order food with <span>GB Panda</span></h1>
        <p>Get your favorite meals delivered in minutes</p>
        <div className="hero-search">
          <input placeholder="Enter your delivery address..." />
          <button>Find Food</button>
        </div>
      </div>
      <div className="hero-image">🍕🍔🍛</div>
    </section>
  );
};
export default Hero;