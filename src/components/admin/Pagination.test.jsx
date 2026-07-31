import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "./Pagination";

describe("Pagination", () => {
  it("renders nothing when there are no elements", () => {
    const { container } = render(
      <Pagination page={0} totalPages={0} totalElements={0} size={10} onPageChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("displays the correct range and page info", () => {
    render(
      <Pagination page={1} totalPages={5} totalElements={47} size={10} onPageChange={vi.fn()} />
    );

    // page=1 (0-indexed) -> from = 1*10+1 = 11, to = min(2*10, 47) = 20
    expect(screen.getByText("11-20")).toBeInTheDocument();
    expect(screen.getByText("47")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
  });

  it("clamps the upper bound of the range to totalElements on the last page", () => {
    render(
      <Pagination page={4} totalPages={5} totalElements={47} size={10} onPageChange={vi.fn()} />
    );

    // page=4 -> from = 41, to = min(50, 47) = 47
    expect(screen.getByText("41-47")).toBeInTheDocument();
    expect(screen.getByText("Page 5 of 5")).toBeInTheDocument();
  });

  it("calls onPageChange with the next page number when the next button is clicked", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination page={1} totalPages={5} totalElements={47} size={10} onPageChange={onPageChange} />
    );

    const [, nextButton] = screen.getAllByRole("button");
    await user.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange with the previous page number when the prev button is clicked", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination page={1} totalPages={5} totalElements={47} size={10} onPageChange={onPageChange} />
    );

    const [prevButton] = screen.getAllByRole("button");
    await user.click(prevButton);

    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  it("disables the prev button on the first page", () => {
    render(
      <Pagination page={0} totalPages={5} totalElements={47} size={10} onPageChange={vi.fn()} />
    );

    const [prevButton, nextButton] = screen.getAllByRole("button");
    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it("disables the next button on the last page", () => {
    render(
      <Pagination page={4} totalPages={5} totalElements={47} size={10} onPageChange={vi.fn()} />
    );

    const [prevButton, nextButton] = screen.getAllByRole("button");
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).toBeDisabled();
  });
});
