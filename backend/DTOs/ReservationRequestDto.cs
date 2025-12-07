namespace Restaurant.DTOs
{
    public class ReservationRequestDto
    {
        public string Name { get; set; }
        public string Phone { get; set; }
        public string Date { get; set; }
        public string Time { get; set; }
        public int Guests { get; set; }
    }
}
