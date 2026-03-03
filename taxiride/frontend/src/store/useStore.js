import { create } from 'zustand';

const useStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  currentRide: null,
  driverLocation: null,

  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.clear();
    set({ user: null, token: null });
  },
  setCurrentRide: (ride) => set({ currentRide: ride }),
  setDriverLocation: (loc) => set({ driverLocation: loc }),
}));

export default useStore;
