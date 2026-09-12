package validators

import (
	"testing"
)

// Test valid Ethiopian phone numbers are accepted
func TestParsePhone_ValidNumbers(t *testing.T) {
	validNumbers := []struct {
		input   string
		digits  string
		network string
		prefix  string
	}{
		{"0712345678", "0712345678", "Safaricom", "07"},
		{"0798765432", "0798765432", "Safaricom", "07"},
		{"0912345678", "0912345678", "Ethio Telecom", "09"},
		{"0987654321", "0987654321", "Ethio Telecom", "09"},
		{"071 234 5678", "0712345678", "Safaricom", "07"}, // with spaces
		{"071-234-5678", "0712345678", "Safaricom", "07"}, // with dashes
		{"(071) 234-5678", "0712345678", "Safaricom", "07"}, // with parens
	}

	for _, tc := range validNumbers {
		t.Run(tc.input, func(t *testing.T) {
			phone, err := ParsePhone(tc.input)
			if err != nil {
				t.Errorf("ParsePhone(%q) returned error: %v", tc.input, err)
				return
			}
			if phone.Digits() != tc.digits {
				t.Errorf("ParsePhone(%q).Digits() = %q, want %q", tc.input, phone.Digits(), tc.digits)
			}
			if phone.Network() != tc.network {
				t.Errorf("ParsePhone(%q).Network() = %q, want %q", tc.input, phone.Network(), tc.network)
			}
			if phone.Prefix() != tc.prefix {
				t.Errorf("ParsePhone(%q).Prefix() = %q, want %q", tc.input, phone.Prefix(), tc.prefix)
			}
		})
	}
}

// Test invalid phone numbers are rejected
func TestParsePhone_InvalidNumbers(t *testing.T) {
	invalidNumbers := []struct {
		input       string
		expectedErr error
	}{
		{"", ErrInvalidFormat},
		{"123", ErrInvalidLength},
		{"07123456789", ErrInvalidLength}, // too long
		{"071234567", ErrInvalidLength},   // too short
		{"0812345678", ErrInvalidPrefix},  // invalid prefix
		{"0612345678", ErrInvalidPrefix},  // invalid prefix
		{"1712345678", ErrInvalidPrefix},  // doesn't start with 0
		{"abcdefghij", ErrInvalidLength},  // non-digits
	}

	for _, tc := range invalidNumbers {
		t.Run(tc.input, func(t *testing.T) {
			phone, err := ParsePhone(tc.input)
			if err == nil {
				t.Errorf("ParsePhone(%q) succeeded with %v, want error %v", tc.input, phone, tc.expectedErr)
				return
			}
			if err != tc.expectedErr {
				t.Errorf("ParsePhone(%q) error = %v, want %v", tc.input, err, tc.expectedErr)
			}
		})
	}
}

// Test phone number round-trip property
func TestParsePhone_RoundTrip(t *testing.T) {
	testCases := []string{
		"0712345678",
		"0912345678",
		"0798765432",
		"0987654321",
	}

	for _, tc := range testCases {
		t.Run(tc, func(t *testing.T) {
			// Parse once
			phone1, err := ParsePhone(tc)
			if err != nil {
				t.Fatalf("First ParsePhone(%q) failed: %v", tc, err)
			}

			// Parse the digits again
			phone2, err := ParsePhone(phone1.Digits())
			if err != nil {
				t.Fatalf("Second ParsePhone(%q) failed: %v", phone1.Digits(), err)
			}

			// They should be equal
			if !phone1.Equal(phone2) {
				t.Errorf("Round-trip failed: phone1(%v) != phone2(%v)", phone1, phone2)
			}
		})
	}
}

// Test phone number formatting
func TestPhoneNumber_Formatted(t *testing.T) {
	testCases := []struct {
		input    string
		expected string
	}{
		{"0712345678", "07 1234 5678"},
		{"0912345678", "09 1234 5678"},
		{"0798765432", "07 9876 5432"},
	}

	for _, tc := range testCases {
		t.Run(tc.input, func(t *testing.T) {
			phone, err := ParsePhone(tc.input)
			if err != nil {
				t.Fatalf("ParsePhone(%q) failed: %v", tc.input, err)
			}

			formatted := phone.Formatted()
			if formatted != tc.expected {
				t.Errorf("Formatted() = %q, want %q", formatted, tc.expected)
			}
		})
	}
}

// Test phone number normalization
func TestParsePhone_Normalization(t *testing.T) {
	testCases := []struct {
		input    string
		expected string
	}{
		{"071 234 5678", "0712345678"},
		{"071-234-5678", "0712345678"},
		{"(071) 234-5678", "0712345678"},
		{"071.234.5678", "0712345678"},
		{"  071  234  5678  ", "0712345678"},
	}

	for _, tc := range testCases {
		t.Run(tc.input, func(t *testing.T) {
			phone, err := ParsePhone(tc.input)
			if err != nil {
				t.Fatalf("ParsePhone(%q) failed: %v", tc.input, err)
			}

			if phone.Digits() != tc.expected {
				t.Errorf("Digits() = %q, want %q", phone.Digits(), tc.expected)
			}
		})
	}
}

// Test network detection
func TestPhoneNumber_Network(t *testing.T) {
	testCases := []struct {
		input   string
		network string
	}{
		{"0712345678", "Safaricom"},
		{"0798765432", "Safaricom"},
		{"0912345678", "Ethio Telecom"},
		{"0987654321", "Ethio Telecom"},
	}

	for _, tc := range testCases {
		t.Run(tc.input, func(t *testing.T) {
			phone, err := ParsePhone(tc.input)
			if err != nil {
				t.Fatalf("ParsePhone(%q) failed: %v", tc.input, err)
			}

			if phone.Network() != tc.network {
				t.Errorf("Network() = %q, want %q", phone.Network(), tc.network)
			}
		})
	}
}

// Test Equal method
func TestPhoneNumber_Equal(t *testing.T) {
	phone1, _ := ParsePhone("0712345678")
	phone2, _ := ParsePhone("071 234 5678") // same number, different format
	phone3, _ := ParsePhone("0912345678")   // different number

	if !phone1.Equal(phone2) {
		t.Error("phone1 should equal phone2 (same digits)")
	}

	if phone1.Equal(phone3) {
		t.Error("phone1 should not equal phone3 (different digits)")
	}

	if phone1.Equal(nil) {
		t.Error("phone1 should not equal nil")
	}
}

// Test String method
func TestPhoneNumber_String(t *testing.T) {
	phone, _ := ParsePhone("071 234 5678")
	expected := "0712345678"

	if phone.String() != expected {
		t.Errorf("String() = %q, want %q", phone.String(), expected)
	}
}

// Edge case tests
func TestParsePhone_EdgeCases(t *testing.T) {
	t.Run("empty string", func(t *testing.T) {
		_, err := ParsePhone("")
		if err != ErrInvalidFormat {
			t.Errorf("ParsePhone(\"\") error = %v, want %v", err, ErrInvalidFormat)
		}
	})

	t.Run("only spaces", func(t *testing.T) {
		_, err := ParsePhone("   ")
		if err != ErrInvalidLength {
			t.Errorf("ParsePhone(\"   \") error = %v, want %v", err, ErrInvalidLength)
		}
	})

	t.Run("special characters only", func(t *testing.T) {
		_, err := ParsePhone("---")
		if err != ErrInvalidLength {
			t.Errorf("ParsePhone(\"---\") error = %v, want %v", err, ErrInvalidLength)
		}
	})
}
