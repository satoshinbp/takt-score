package score

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

const (
	defaultMaxItems = 50
	hardMaxItems    = 200
)

type Handler struct {
	svc *Service
	log *slog.Logger
}

func NewHandler(svc *Service, log *slog.Logger) *Handler {
	return &Handler{svc: svc, log: log}
}

func (h *Handler) Routes(r chi.Router) {
	r.Get("/", h.list)
	r.Post("/", h.create)
	r.Get("/{id}", h.get)
	r.Put("/{id}", h.update)
	r.Delete("/{id}", h.delete)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	maxItems := parseBoundedInt(r.URL.Query().Get("maxItems"), defaultMaxItems, 1, hardMaxItems)
	offset := parseBoundedInt(r.URL.Query().Get("offset"), 0, 0, 1<<30)
	out, err := h.svc.List(r.Context(), maxItems, offset)
	if err != nil {
		h.writeError(w, r, http.StatusInternalServerError, "failed to list scores", err)
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	detail, err := h.svc.Get(r.Context(), id)
	if err != nil {
		h.handleServiceError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, detail)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	in, ok := decodeInput(w, r)
	if !ok {
		return
	}
	detail, err := h.svc.Create(r.Context(), in)
	if err != nil {
		h.handleServiceError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, detail)
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	in, ok := decodeInput(w, r)
	if !ok {
		return
	}
	detail, err := h.svc.Update(r.Context(), id, in)
	if err != nil {
		h.handleServiceError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, detail)
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	if err := h.svc.Delete(r.Context(), id); err != nil {
		h.handleServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func parseID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	raw := chi.URLParam(r, "id")
	id, err := uuid.Parse(raw)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, errBody{Detail: "invalid id"})
		return uuid.Nil, false
	}
	return id, true
}

func decodeInput(w http.ResponseWriter, r *http.Request) (*ScoreInput, bool) {
	var in ScoreInput
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&in); err != nil {
		writeJSON(w, http.StatusBadRequest, errBody{Detail: "invalid request body: " + err.Error()})
		return nil, false
	}
	return &in, true
}

func parseBoundedInt(raw string, fallback, lo, hi int) int {
	if raw == "" {
		return fallback
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	if n < lo {
		return lo
	}
	if n > hi {
		return hi
	}
	return n
}

func (h *Handler) handleServiceError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		writeJSON(w, http.StatusNotFound, errBody{Detail: "score not found"})
	case errors.Is(err, ErrValidation):
		writeJSON(w, http.StatusBadRequest, errBody{Detail: err.Error()})
	default:
		h.writeError(w, r, http.StatusInternalServerError, "internal error", err)
	}
}

func (h *Handler) writeError(w http.ResponseWriter, r *http.Request, status int, msg string, err error) {
	h.log.Error(msg, "err", err, "path", r.URL.Path)
	writeJSON(w, status, errBody{Detail: msg})
}

type errBody struct {
	Detail string `json:"detail"`
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
