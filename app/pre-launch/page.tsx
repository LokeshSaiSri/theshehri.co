'use client';

import { useEffect, useState, FormEvent } from 'react';
import Head from 'next/head';

export default function PreLaunchPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [bookingProduct, setBookingProduct] = useState<any | null>(null);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // We take up to 4 products to scatter in 4 corners
                    setProducts(data.slice(0, 4));
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

        // Secret Admin Unlock Shortcut
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
                e.preventDefault();
                fetch('/api/admin/unlock', { method: 'POST' }).then(() => {
                    window.location.href = '/admin/login';
                });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handlePreorderSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        data.product = bookingProduct?.name; // auto-inject product name
        
        try {
            await fetch('/api/preorders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (err) {
            console.error('Failed to submit pre-order', err);
        }

        setFormSubmitted(true);
    };

    // Calculate scattered position for desktop
    const getDesktopPosition = (index: number) => {
        const positions = [
            { top: '10%', left: '8%' }, // Top Left
            { bottom: '10%', right: '8%' }, // Bottom Right
            { top: '15%', right: '5%' }, // Top Right
            { bottom: '15%', left: '5%' } // Bottom Left
        ];
        // Add slight randomized offsets using inline styles for a more organic feel
        const pos = positions[index % 4];
        return {
            ...pos,
            transform: `rotate(${Math.random() * 4 - 2}deg)` // slight tilt -2 to 2 degrees
        };
    };

    return (
        <div className="prelaunch-wrapper">
            <style dangerouslySetInnerHTML={{ __html: `
                .prelaunch-wrapper {
                    --paper: #F6F3EE;
                    --ink: #191714;
                    --linen: #EFEAE2;
                    --stone: #CEC8BF;
                    --terracotta: #C04E18;
                    --gold: #7A6648;
                    
                    background-color: var(--paper);
                    color: var(--ink);
                    font-family: var(--font-ibm-plex-mono), monospace;
                    position: relative;
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                .prelaunch-wrapper::before {
                    content: '';
                    position: fixed;
                    top: 0; left: 0; width: 100vw; height: 100vh;
                    pointer-events: none; z-index: 0; opacity: 0.04;
                    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30L30 0z M30 15L45 30L30 45L15 30L30 15z' fill='none' stroke='%23CEC8BF' stroke-width='1'/%3E%3Ccircle cx='30' cy='30' r='5' fill='none' stroke='%23CEC8BF' stroke-width='1'/%3E%3C/svg%3E");
                    background-size: 60px 60px;
                }

                .prelaunch-wrapper * {
                    box-sizing: border-box; margin: 0; padding: 0;
                }

                /* Typography */
                .bebas { font-family: var(--font-bebas-neue), 'Bebas Neue', sans-serif; font-weight: 400; }
                .rajdhani { font-family: var(--font-rajdhani), 'Rajdhani', sans-serif; }
                .mono { font-family: var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace; }
                .devanagari { font-family: var(--font-noto-sans-devanagari), 'Noto Sans Devanagari', sans-serif; color: var(--terracotta); }

                /* Center Hero */
                .hero-center {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    z-index: 10;
                    pointer-events: none; /* Allows clicking cards underneath if they overlap */
                }

                .hero-wordmark {
                    font-size: clamp(3.5rem, 8vw, 8rem);
                    line-height: 1;
                    position: relative;
                    display: inline-block;
                    margin-bottom: 0.5rem;
                }

                .hero-tagline {
                    font-size: 0.9rem;
                    letter-spacing: 0.3em;
                    text-transform: uppercase;
                    color: var(--ink);
                    opacity: 0.8;
                }

                /* Products Container */
                .products-scatter-container {
                    position: relative;
                    width: 100vw;
                    min-height: 100vh;
                    z-index: 5;
                }

                /* Product Card */
                .scattered-card {
                    width: 280px;
                    background: var(--paper);
                    border: 1px solid var(--stone);
                    padding: 1.2rem;
                    transition: border-color 0.4s ease, box-shadow 0.4s ease;
                    cursor: pointer;
                    z-index: 5;
                }

                .scattered-card:hover {
                    border-color: var(--terracotta);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    z-index: 20 !important; /* bring to front on hover */
                }

                /* Images */
                .card-image {
                    width: 100%;
                    aspect-ratio: 3/4;
                    background-color: var(--linen);
                    border: 1px solid var(--stone);
                    margin-bottom: 1rem;
                    position: relative;
                    overflow: hidden;
                }

                .card-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    position: relative;
                    z-index: 1;
                }

                .card-image::before {
                    content: '';
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20L20 0z M20 10L30 20L20 30L10 20L20 10z' fill='none' stroke='%23CEC8BF' stroke-width='0.5'/%3E%3C/svg%3E");
                    background-size: 40px 40px; opacity: 0.4; z-index: 0;
                }

                /* Details */
                .card-name { font-size: 2rem; line-height: 1; margin-bottom: 0.4rem; }
                .card-price { font-size: 0.9rem; opacity: 0.8; margin-bottom: 1rem; display: block;}
                
                .action-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid var(--stone);
                    padding-top: 1rem;
                    margin-top: 1rem;
                }

                .prebook-badge {
                    font-size: 0.75rem;
                    color: var(--terracotta);
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                }

                .arrow-icon {
                    font-size: 1.2rem;
                    transition: transform 0.3s ease;
                }

                .scattered-card:hover .arrow-icon {
                    transform: translateX(5px);
                    color: var(--terracotta);
                }

                /* Modal */
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(246, 243, 238, 0.85);
                    backdrop-filter: blur(8px);
                    z-index: 50;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.4s ease;
                }
                .modal-overlay.open {
                    opacity: 1;
                    pointer-events: all;
                }
                
                .modal-content {
                    background: var(--paper);
                    border: 1px solid var(--ink);
                    width: 90%;
                    max-width: 500px;
                    padding: 3rem;
                    position: relative;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                }

                .close-modal {
                    position: absolute;
                    top: 1.5rem; right: 1.5rem;
                    background: none; border: none;
                    font-size: 1.2rem; cursor: pointer; color: var(--ink);
                    font-family: var(--font-ibm-plex-mono), monospace;
                }
                .close-modal:hover { color: var(--terracotta); }

                /* Form Styles inside Modal */
                .modal-title { font-size: 3rem; margin-bottom: 0.5rem; line-height: 1; }
                .modal-subtitle { font-size: 0.8rem; opacity: 0.7; margin-bottom: 2rem; }
                
                .form-group { margin-bottom: 1.5rem; }
                .form-label { display: block; font-size: 0.75rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; }
                .form-input, .form-select {
                    width: 100%; padding: 1rem; background: transparent; border: 1px solid var(--stone);
                    font-family: var(--font-ibm-plex-mono), monospace; color: var(--ink); font-size: 0.9rem;
                    appearance: none; outline: none; border-radius: 0; transition: border-color 0.3s ease;
                }
                .form-input:focus, .form-select:focus { border-color: var(--ink); }
                .form-select {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23191714' stroke-width='2' stroke-linecap='square' stroke-linejoin='miter'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat; background-position: right 1rem center;
                }

                .submit-btn {
                    background: var(--ink); color: var(--paper); border: none; padding: 1.2rem 2rem;
                    font-family: var(--font-bebas-neue), 'Bebas Neue', sans-serif; font-size: 1.5rem;
                    letter-spacing: 0.05em; cursor: pointer; width: 100%; margin-top: 1rem;
                    transition: background-color 0.4s ease;
                }
                .submit-btn:hover { background-color: var(--terracotta); }

                /* Desktop specific scattering */
                @media (min-width: 768px) {
                    .scattered-card {
                        position: absolute;
                    }
                }

                /* Mobile specific stacking */
                @media (max-width: 767px) {
                    .hero-center {
                        position: relative;
                        top: 0; left: 0; transform: none;
                        padding: 4rem 2rem 2rem 2rem;
                    }
                    .products-scatter-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 2rem;
                        padding: 0 1.5rem 4rem 1.5rem;
                        min-height: auto;
                    }
                    .scattered-card {
                        width: 100%;
                        max-width: 400px;
                    }
                    .modal-content { padding: 2rem 1.5rem; }
                }
            `}} />

            {/* Central Fixed Hero Text */}
            <header className="hero-center">
                <div className="hero-wordmark bebas">
                    THE <span className="devanagari">शहरी</span> CO.
                </div>
                <div className="hero-tagline mono">Fit With No Logo</div>
            </header>

            {/* Scattered Products Layer */}
            <div className="products-scatter-container">
                {loading ? (
                    <div className="mono" style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', opacity: 0.5 }}>
                        Loading Drops...
                    </div>
                ) : (
                    products.map((product, index) => (
                        <div 
                            key={product.id || index} 
                            className="scattered-card"
                            style={getDesktopPosition(index)}
                            onClick={() => {
                                setBookingProduct(product);
                                setFormSubmitted(false); // Reset form state if opening a new one
                            }}
                        >
                            <div className="card-image">
                                {/* If product has an image, render it, else fallback to SVG pattern */}
                                {product.images && product.images[0] ? (
                                    <img src={product.images[0]} alt={product.name} />
                                ) : null}
                            </div>
                            <h3 className="card-name bebas">{product.name}</h3>
                            <span className="card-price mono">₹{product.price || 'TBA'}</span>
                            
                            <div className="action-row rajdhani">
                                <span className="prebook-badge">DROP 001 · SECURE NOW</span>
                                <span className="arrow-icon">→</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Global Pre-book Modal */}
            <div className={`modal-overlay ${bookingProduct ? 'open' : ''}`}>
                <div className="modal-content">
                    <button className="close-modal" onClick={() => setBookingProduct(null)}>✕</button>
                    
                    {!formSubmitted ? (
                        <>
                            <h2 className="modal-title bebas">CLAIM YOUR DROP</h2>
                            <p className="modal-subtitle mono">Locking in: {bookingProduct?.name}. No restocks.</p>
                            
                            <form onSubmit={handlePreorderSubmit}>
                                <div className="form-group">
                                    <label className="form-label mono">Name</label>
                                    <input type="text" name="name" className="form-input" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label mono">Email</label>
                                    <input type="email" name="email" className="form-input" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label mono">Phone (Optional)</label>
                                    <input type="tel" name="phone" className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label mono">Select Size</label>
                                    <select name="size" className="form-select" required defaultValue="">
                                        <option value="" disabled>Choose your size</option>
                                        <option value="xs">XS</option>
                                        <option value="s">S</option>
                                        <option value="m">M</option>
                                        <option value="l">L</option>
                                        <option value="xl">XL</option>
                                    </select>
                                </div>
                                <button type="submit" className="submit-btn">RESERVE MY PAIR</button>
                            </form>
                        </>
                    ) : (
                        <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                            <h2 className="modal-title bebas">YOU'RE IN.</h2>
                            <p className="mono mt-4" style={{ opacity: 0.8, lineHeight: 1.6 }}>
                                Your reservation for the <strong>{bookingProduct?.name}</strong> is secure.<br/><br/>
                                Keep an eye on your email for the private checkout link.
                            </p>
                            <button 
                                onClick={() => setBookingProduct(null)} 
                                style={{ marginTop: '3rem', background: 'transparent', border: '1px solid var(--ink)', padding: '1rem 2rem', cursor: 'pointer' }}
                                className="mono"
                            >
                                CLOSE
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
