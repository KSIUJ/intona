export default function PlaceholderBox({ label, height = "120px" }) {
    return (
        <div
            style={{
                border: "2px dashed #c7cad1",
                borderRadius: "12px",
                height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9aa0ab",
                fontSize: "14px",
                fontStyle: "italic",
                background: "#fafbfc",
            }}
        >
            {label}
        </div>
    );
}