import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { db } from "../firebase";
import { collection, onSnapshot, query, where, addDoc, doc, updateDoc, increment } from "firebase/firestore";
import { Star } from "lucide-react";

const ReviewSection = ({ restaurantId }) => {
  const { currentUser, userData } = useAuth();
  const { showToast } = useToast();
  
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Reviews
  useEffect(() => {
    const q = query(collection(db, "reviews"), where("restaurantId", "==", restaurantId));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort newest first locally
      data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setReviews(data);
    });
    return () => unsub();
  }, [restaurantId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return showToast("Log in to leave a review.", "error");
    if (!comment.trim()) return showToast("Write a short review.", "error");

    setIsSubmitting(true);
    try {
      const reviewData = {
        restaurantId,
        customerId: currentUser.uid,
        customerName: userData?.name || "Anonymous",
        rating: Number(rating),
        comment,
        createdAt: new Date()
      };

      await addDoc(collection(db, "reviews"), reviewData);

      // Update restaurant average rating (simplified calculation)
      // In a production app, you'd use a Cloud Function for this to avoid race conditions
      const restaurantRef = doc(db, "restaurants", restaurantId);
      await updateDoc(restaurantRef, {
        // Note: For exact average, you need existing review count and sum. 
        // Using increment is an approximation for demonstration.
        reviewCount: increment(1) 
      });

      showToast("Review submitted! Thank you.", "success");
      setComment("");
      setRating(5);
    } catch (error) {
      console.error(error);
      showToast("Failed to submit review.", "error");
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ marginTop: "40px", borderTop: "2px solid #eee", paddingTop: "30px" }}>
      <h2 style={{ fontSize: "22px", marginBottom: "20px", color: "#1a1a2e" }}>Customer Reviews ({reviews.length})</h2>
      
      {/* Write Review Form */}
      {currentUser && (
        <form onSubmit={handleSubmit} style={{ background: "#f9f9f9", padding: "20px", borderRadius: "12px", marginBottom: "30px" }}>
          <h4 style={{ margin: "0 0 10px 0" }}>Leave a Review</h4>
          <div style={{ display: "flex", gap: "5px", marginBottom: "15px" }}>
            {[1, 2, 3, 4, 5].map(star => (
              <Star 
                key={star} size={24} 
                fill={star <= rating ? "gold" : "none"} 
                color={star <= rating ? "gold" : "#ccc"} 
                style={{ cursor: "pointer" }} 
                onClick={() => setRating(star)} 
              />
            ))}
          </div>
          <textarea 
            placeholder="How was your food and delivery experience?" 
            value={comment} onChange={(e) => setComment(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", minHeight: "80px", marginBottom: "10px", outline: "none" }}
          />
          <button type="submit" disabled={isSubmitting} style={{ background: "#1a1a2e", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: isSubmitting ? "not-allowed" : "pointer" }}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {reviews.length === 0 && <p style={{ color: "#888" }}>No reviews yet. Be the first!</p>}
        {reviews.map(review => (
          <div key={review.id} style={{ background: "#fff", padding: "15px", borderRadius: "10px", border: "1px solid #eee" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <strong>{review.customerName}</strong>
              <div style={{ display: "flex" }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={14} fill={star <= review.rating ? "gold" : "none"} color={star <= review.rating ? "gold" : "#ccc"} />
                ))}
              </div>
            </div>
            <p style={{ margin: 0, color: "#444", fontSize: "14px" }}>{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSection;