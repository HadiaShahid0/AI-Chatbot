import {
  FiMenu,
  FiMoreVertical,
  FiStar,
} from "react-icons/fi";

const ChatHeader = ({ onMenuClick }) => {
  return (
    <header className="border-bottom bg-white px-3 py-2">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-light d-lg-none p-2"
            onClick={onMenuClick}
          >
            <FiMenu size={22} />
          </button>

          <div
            className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary"
            style={{ width: "42px", height: "42px" }}
          >
            <FiStar size={20} />
          </div>

          <div>
            <h6 className="mb-0 fw-semibold">AI Assistant</h6>

            <div className="d-flex align-items-center gap-1 text-muted small">
              <span
                className="bg-success rounded-circle"
                style={{
                  width: "7px",
                  height: "7px",
                  display: "inline-block",
                }}
              />

              <span>Online</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-light p-2"
        >
          <FiMoreVertical size={21} />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
